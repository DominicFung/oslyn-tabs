#!/bin/zsh

mkdir -p ./ios/fastlane
cp -f ./fastlane_assets/ios/* ./ios/fastlane

# App Store Connect API key. Fetched here so it does not have to live on one Mac.
auth_key=./ios/fastlane/AuthKey_6889KV46S3.p8

echo "getting $auth_key"
if ! aws secretsmanager get-secret-value \
  --profile a1 \
  --secret-id oslynstudio/appstore-authkey \
  --region us-east-1 \
  --query SecretString \
  --output text > "$auth_key" || [[ ! -s "$auth_key" ]]; then
  rm -f "$auth_key"
  echo "Could not fetch the App Store Connect API key. Check AWS credentials (e.g. aws sso login / aws configure for account 006033392195)." >&2
  exit 1
fi
chmod 600 "$auth_key"
