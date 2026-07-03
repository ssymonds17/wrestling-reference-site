import { Duration, aws_lambda } from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

interface LambdaConstructProps {
  handler: string
  code: aws_lambda.AssetCode
  timeout?: Duration
  functionName?: string
  environment?: { [key: string]: string }
}

export class LambdaConstruct extends Construct {
  public readonly function: lambda.Function
  public readonly alias: lambda.Alias

  constructor(
    scope: Construct,
    id: string,
    { functionName, handler, code, timeout, environment }: LambdaConstructProps
  ) {
    super(scope, id)

    this.function = new lambda.Function(this, id, {
      functionName,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler,
      code,
      timeout,
      environment,
    })
  }
}
