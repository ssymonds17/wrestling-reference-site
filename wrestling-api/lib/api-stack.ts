import * as core from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import { LambdaConstruct } from "./constructs/lambda"

export class ApiStack extends core.Stack {
  constructor(scope: core.App, id: string, props: any) {
    super(scope, id, props)

    const mongodbUri = process.env.MONGODB_URI
    if (!mongodbUri) {
      throw new Error("MONGODB_URI environment variable is required")
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY environment variable is required")
    }

    const lambdaEnvironment = {
      MONGODB_URI: mongodbUri,
      CLERK_SECRET_KEY: clerkSecretKey,
    }

    // Lambda functions for Wrestlers
    const createWrestlerLambda = new LambdaConstruct(this, "CreateWrestler", {
      functionName: "wrestling-create-wrestler-handler",
      code: lambda.Code.fromAsset("build/apps/create-wrestler"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const getWrestlersLambda = new LambdaConstruct(this, "GetWrestlers", {
      functionName: "wrestling-get-wrestlers-handler",
      code: lambda.Code.fromAsset("build/apps/get-wrestlers"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    // API Gateway
    const api = new apigateway.RestApi(this, "WrestlingApi", {
      restApiName: "wrestling-api",
    })

    // RESOURCES - Wrestlers
    const wrestlers = api.root.addResource("wrestlers")
    wrestlers.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getWrestlersLambda.function)
    )
    wrestlers.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    const wrestler = api.root.addResource("wrestler")
    wrestler.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createWrestlerLambda.function)
    )
    wrestler.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
    })
  }
}
