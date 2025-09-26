#!/bin/bash

echo "🚀 Deploying band memberships schema changes..."

# Set environment variables
export AWS_REGION=${AWS_REGION:-us-east-1}
export STACK_NAME=${STACK_NAME:-oslyn-dev}

echo "📊 Environment:"
echo "  - AWS_REGION: $AWS_REGION"
echo "  - STACK_NAME: $STACK_NAME"

# 1. Deploy the updated GraphQL schema and Lambda functions
echo "📦 Deploying CDK stack..."
cd /Users/alexho/oslyn-tabs/aws
npm run deploy

if [ $? -ne 0 ]; then
    echo "❌ CDK deployment failed"
    exit 1
fi

echo "✅ CDK deployment completed"

# 2. Run the migration script
echo "🔄 Running migration script..."
cd /Users/alexho/oslyn-tabs/aws/scripts
npm run build
node dist/migrate-band-memberships.js

if [ $? -ne 0 ]; then
    echo "❌ Migration failed"
    exit 1
fi

echo "✅ Migration completed"

# 3. Test the implementation
echo "🧪 Testing implementation..."
node dist/test-band-memberships.js

if [ $? -ne 0 ]; then
    echo "❌ Test failed"
    exit 1
fi

echo "✅ Test completed"

echo "🎉 Band memberships schema migration completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test the Flutter app to ensure Bands tab works correctly"
echo "2. Monitor performance improvements"
echo "3. Consider removing the old UserBandMembershipTable after confirming everything works"
