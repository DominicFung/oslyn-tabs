#!/bin/zsh

SECRETJSON=$( cat web/secret.json )
CDKOUTJSON=$( cat web/cdk-outputs.json )
AWSEXPORTS=$( cat src/aws-exports.js )
AMPLIFYCONF=$( cat src/amplifyconfiguration.json )

aws secretsmanager update-secret --secret-id oslynstudio/secret \
--description "Third Party Secrets for Oslyn Studio" \
--secret-string "$SECRETJSON" --region us-east-1 --profile a1

aws secretsmanager update-secret --secret-id oslynstudio/cdk \
--description "AWS Infrastructure for Oslyn Studio" \
--secret-string "$CDKOUTJSON" --region us-east-1 --profile a1

aws secretsmanager update-secret --secret-id oslynstudio/awsexports \
--description "AWS Infrastructure for Oslyn Studio" \
--secret-string "$AWSEXPORTS" --region us-east-1 --profile a1

aws secretsmanager update-secret --secret-id oslynstudio/amplifyconf \
--description "AWS Infrastructure for Oslyn Studio" \
--secret-string "$AMPLIFYCONF" --region us-east-1 --profile a1