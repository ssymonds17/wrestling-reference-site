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

    // Lambda function for Search
    const searchLambda = new LambdaConstruct(this, "Search", {
      functionName: "wrestling-search-handler",
      code: lambda.Code.fromAsset("build/apps/search"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    // Lambda functions for Matches
    const createMatchLambda = new LambdaConstruct(this, "CreateMatch", {
      functionName: "wrestling-create-match-handler",
      code: lambda.Code.fromAsset("build/apps/create-match"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const getMatchesLambda = new LambdaConstruct(this, "GetMatches", {
      functionName: "wrestling-get-matches-handler",
      code: lambda.Code.fromAsset("build/apps/get-matches"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const getMatchByIdLambda = new LambdaConstruct(this, "GetMatchById", {
      functionName: "wrestling-get-match-by-id-handler",
      code: lambda.Code.fromAsset("build/apps/get-match-by-id"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const deleteMatchLambda = new LambdaConstruct(this, "DeleteMatch", {
      functionName: "wrestling-delete-match-handler",
      code: lambda.Code.fromAsset("build/apps/delete-match"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const updateMatchLambda = new LambdaConstruct(this, "UpdateMatch", {
      functionName: "wrestling-update-match-handler",
      code: lambda.Code.fromAsset("build/apps/update-match"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const updateParticipantRatingLambda = new LambdaConstruct(
      this,
      "UpdateParticipantRating",
      {
        functionName: "wrestling-update-participant-rating-handler",
        code: lambda.Code.fromAsset("build/apps/update-participant-rating"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    const updateOverallMatchRatingLambda = new LambdaConstruct(
      this,
      "UpdateOverallMatchRating",
      {
        functionName: "wrestling-update-overall-match-rating-handler",
        code: lambda.Code.fromAsset("build/apps/update-overall-match-rating"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    // Lambda functions for WrestlerYears / tiers / recomputes
    const getWrestlerYearsLambda = new LambdaConstruct(
      this,
      "GetWrestlerYears",
      {
        functionName: "wrestling-get-wrestler-years-handler",
        code: lambda.Code.fromAsset("build/apps/get-wrestler-years"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    const getYearStandingsLambda = new LambdaConstruct(
      this,
      "GetYearStandings",
      {
        functionName: "wrestling-get-year-standings-handler",
        code: lambda.Code.fromAsset("build/apps/get-year-standings"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    const getYearsLambda = new LambdaConstruct(this, "GetYears", {
      functionName: "wrestling-get-years-handler",
      code: lambda.Code.fromAsset("build/apps/get-years"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const assignTierLambda = new LambdaConstruct(this, "AssignTier", {
      functionName: "wrestling-assign-tier-handler",
      code: lambda.Code.fromAsset("build/apps/assign-tier"),
      handler: "index.handler",
      timeout: core.Duration.seconds(30),
      environment: lambdaEnvironment,
    })

    const recomputeWrestlerYearLambda = new LambdaConstruct(
      this,
      "RecomputeWrestlerYear",
      {
        functionName: "wrestling-recompute-wrestler-year-handler",
        code: lambda.Code.fromAsset("build/apps/recompute-wrestler-year"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    const recomputeCareerScoreLambda = new LambdaConstruct(
      this,
      "RecomputeCareerScore",
      {
        functionName: "wrestling-recompute-career-score-handler",
        code: lambda.Code.fromAsset("build/apps/recompute-career-score"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

    const getCareerLeaderboardLambda = new LambdaConstruct(
      this,
      "GetCareerLeaderboard",
      {
        functionName: "wrestling-get-career-leaderboard-handler",
        code: lambda.Code.fromAsset("build/apps/get-career-leaderboard"),
        handler: "index.handler",
        timeout: core.Duration.seconds(30),
        environment: lambdaEnvironment,
      }
    )

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

    // /wrestler/{id}/years
    const wrestlerYearsRes = wrestlerById.addResource("years")
    wrestlerYearsRes.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getWrestlerYearsLambda.function)
    )
    wrestlerYearsRes.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // /wrestler/{id}/year/{year}/{tier | recompute}
    const wrestlerYear = wrestlerById.addResource("year")
    const wrestlerYearById = wrestlerYear.addResource("{year}")

    const wrestlerYearTier = wrestlerYearById.addResource("tier")
    wrestlerYearTier.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(assignTierLambda.function)
    )
    wrestlerYearTier.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["PUT"],
    })

    const wrestlerYearRecompute = wrestlerYearById.addResource("recompute")
    wrestlerYearRecompute.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(recomputeWrestlerYearLambda.function)
    )
    wrestlerYearRecompute.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["PUT"],
    })

    // /wrestler/{id}/career/recompute
    const wrestlerCareer = wrestlerById.addResource("career")
    const wrestlerCareerRecompute = wrestlerCareer.addResource("recompute")
    wrestlerCareerRecompute.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(recomputeCareerScoreLambda.function)
    )
    wrestlerCareerRecompute.addCorsPreflight({
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

    // RESOURCES - Search
    const searchResource = api.root.addResource("search")
    searchResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(searchLambda.function)
    )
    searchResource.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // RESOURCES - Matches (collection)
    const matches = api.root.addResource("matches")
    matches.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getMatchesLambda.function)
    )
    matches.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // RESOURCES - Match (single)
    const match = api.root.addResource("match")
    match.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createMatchLambda.function)
    )
    match.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
    })

    const matchById = match.addResource("{id}")
    matchById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getMatchByIdLambda.function)
    )
    matchById.addMethod(
      "PATCH",
      new apigateway.LambdaIntegration(updateMatchLambda.function)
    )
    matchById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteMatchLambda.function)
    )
    matchById.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "PATCH", "DELETE"],
    })

    // /match/{id}/overall-rating
    const matchOverallRating = matchById.addResource("overall-rating")
    matchOverallRating.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateOverallMatchRatingLambda.function)
    )
    matchOverallRating.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["PUT"],
    })

    // /match/{id}/participant/{wrestlerId}/rating
    const matchParticipant = matchById.addResource("participant")
    const matchParticipantById = matchParticipant.addResource("{wrestlerId}")
    const matchParticipantRating = matchParticipantById.addResource("rating")
    matchParticipantRating.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateParticipantRatingLambda.function)
    )
    matchParticipantRating.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["PUT"],
    })

    // RESOURCES - Years
    const yearsRes = api.root.addResource("years")
    yearsRes.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getYearsLambda.function)
    )
    yearsRes.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    const yearRes = api.root.addResource("year")
    const yearByN = yearRes.addResource("{year}")
    const yearStandings = yearByN.addResource("standings")
    yearStandings.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getYearStandingsLambda.function)
    )
    yearStandings.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })

    // RESOURCES - Career leaderboard
    const careerLeaderboard = api.root.addResource("career-leaderboard")
    careerLeaderboard.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getCareerLeaderboardLambda.function)
    )
    careerLeaderboard.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    })
  }
}
