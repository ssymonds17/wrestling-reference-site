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

    const getWrestlerByIdLambda = new LambdaConstruct(this, "GetWrestlerById", {
      functionName: "wrestling-get-wrestler-by-id-handler",
      code: lambda.Code.fromAsset("build/apps/get-wrestler-by-id"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const updateWrestlerLambda = new LambdaConstruct(this, "UpdateWrestler", {
      functionName: "wrestling-update-wrestler-handler",
      code: lambda.Code.fromAsset("build/apps/update-wrestler"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const deleteWrestlerLambda = new LambdaConstruct(this, "DeleteWrestler", {
      functionName: "wrestling-delete-wrestler-handler",
      code: lambda.Code.fromAsset("build/apps/delete-wrestler"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const recomputeWrestlerLambda = new LambdaConstruct(
      this,
      "RecomputeWrestler",
      {
        functionName: "wrestling-recompute-wrestler-handler",
        code: lambda.Code.fromAsset("build/apps/recompute-wrestler"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    // Lambda functions for Promotions
    const createPromotionLambda = new LambdaConstruct(this, "CreatePromotion", {
      functionName: "wrestling-create-promotion-handler",
      code: lambda.Code.fromAsset("build/apps/create-promotion"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const getPromotionsLambda = new LambdaConstruct(this, "GetPromotions", {
      functionName: "wrestling-get-promotions-handler",
      code: lambda.Code.fromAsset("build/apps/get-promotions"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const getPromotionByIdLambda = new LambdaConstruct(
      this,
      "GetPromotionById",
      {
        functionName: "wrestling-get-promotion-by-id-handler",
        code: lambda.Code.fromAsset("build/apps/get-promotion-by-id"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    const updatePromotionLambda = new LambdaConstruct(this, "UpdatePromotion", {
      functionName: "wrestling-update-promotion-handler",
      code: lambda.Code.fromAsset("build/apps/update-promotion"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const deletePromotionLambda = new LambdaConstruct(this, "DeletePromotion", {
      functionName: "wrestling-delete-promotion-handler",
      code: lambda.Code.fromAsset("build/apps/delete-promotion"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    // API Gateway
    const api = new apigateway.RestApi(this, "WrestlingApi", {
      restApiName: "wrestling-api",
    })

    // RESOURCES - Wrestlers (collection)
    const wrestlers = api.root.addResource("wrestlers")
    wrestlers.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getWrestlersLambda.function)
    )
    wrestlers.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // RESOURCES - Wrestler (single)
    const wrestler = api.root.addResource("wrestler")
    wrestler.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createWrestlerLambda.function)
    )
    wrestler.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
    })

    const wrestlerById = wrestler.addResource("{id}")
    wrestlerById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getWrestlerByIdLambda.function)
    )
    wrestlerById.addMethod(
      "PATCH",
      new apigateway.LambdaIntegration(updateWrestlerLambda.function)
    )
    wrestlerById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteWrestlerLambda.function)
    )
    wrestlerById.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PATCH", "DELETE"],
    })

    const wrestlerRecompute = wrestlerById.addResource("recompute")
    wrestlerRecompute.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(recomputeWrestlerLambda.function)
    )
    wrestlerRecompute.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["PUT"],
    })

    // RESOURCES - Promotions (collection)
    const promotions = api.root.addResource("promotions")
    promotions.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getPromotionsLambda.function)
    )
    promotions.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // RESOURCES - Promotion (single)
    const promotion = api.root.addResource("promotion")
    promotion.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createPromotionLambda.function)
    )
    promotion.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
    })

    const promotionById = promotion.addResource("{id}")
    promotionById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getPromotionByIdLambda.function)
    )
    promotionById.addMethod(
      "PATCH",
      new apigateway.LambdaIntegration(updatePromotionLambda.function)
    )
    promotionById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deletePromotionLambda.function)
    )
    promotionById.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PATCH", "DELETE"],
    })
  }
}
