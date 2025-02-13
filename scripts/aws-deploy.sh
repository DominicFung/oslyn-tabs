#!/bin/zsh

PROJECT=oslynstudio

echo "checking old cdk-output.json ..."
OLDAPPSYNC=$( cat cdk-outputs.json | python3 -c "import sys, json; print(json.load(sys.stdin)['$PROJECT-AppsyncStack']['${PROJECT}AppsyncId'])" )
echo $OLDAPPSYNC
echo

echo "tsc & cdk deploy ..."
tsc & cdk deploy --all --outputs-file ./cdk-outputs.json --profile a1 --require-approval never

echo "copying cdk-outputs.json ..."
cp -f cdk-outputs.json ../web/cdk-outputs.json 

echo "copying schema.graphql"
cp -f schema.graphql ../schema.graphql

cd ../

echo "uploading secrets / cdk-outputs to AWS ..."
./scripts/update-secret.sh 

NEWAPPSYNC=$( cat web/cdk-outputs.json | python3 -c "import sys, json; print(json.load(sys.stdin)['$PROJECT-AppsyncStack']['${PROJECT}AppsyncId'])" )
echo $NEWAPPSYNC
echo

if [[ $OLDAPPSYNC = $NEWAPPSYNC ]]; then
  echo "updating codegen ..."
  amplify codegen
else
  if [ -z "$NEWAPPSYNC" ]; then
    echo "EXITING. CDK deployment may have failed. No Appsync ID."
  else
    echo "opps, appsync id changed: $OLDAPPSYNC ==> $NEWAPPSYNC"
    amplify codegen remove
    
    echo "run: amplify codegen add --apiId $NEWAPPSYNC"
    amplify codegen add --apiId $NEWAPPSYNC
  fi
fi

echo "updating API.ts in lambda folder .."
cp -f src/API.ts aws/lambdas/API.ts

echo ""

echo "update amplifyconfiguration.json .."
python3 ./scripts/writeAmplifyConfig.py ./aws/cdk-outputs.json

echo "update aws-exports.js ..."
python3 ./scripts/writeAWSExports.py ./aws/cdk-outputs.json

echo "Done."