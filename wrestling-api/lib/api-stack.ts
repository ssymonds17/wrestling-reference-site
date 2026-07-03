import * as core from "aws-cdk-lib"

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

    void lambdaEnvironment

    // API Gateway is instantiated with the first endpoint (CDK rejects a
    // RestApi with zero methods at synth time). When adding the first Lambda,
    // uncomment and extend below:
    //
    //   import * as apigateway from "aws-cdk-lib/aws-apigateway"
    //   import { LambdaConstruct } from "./constructs/lambda"
    //
    //   const api = new apigateway.RestApi(this, "WrestlingApi", {
    //     restApiName: "wrestling-api",
    //   })
  }
}
