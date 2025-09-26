#!/bin/bash

# Deploy band-based access control system
# This script deploys the new tables and runs migration

set -e

echo "🚀 Deploying band-based access control system..."

# 1. Deploy new DynamoDB tables
echo "📊 Step 1: Deploying new DynamoDB tables..."
cd /Users/alexho/oslyn-tabs/aws
npm run deploy

# 2. Wait for tables to be ready
echo "⏳ Step 2: Waiting for tables to be ready..."
sleep 30

# 3. Set environment variables for migration
echo "🔧 Step 3: Setting up environment variables..."
export USER_TABLE_NAME=$(aws cloudformation describe-stacks --stack-name oslyn-dev --query 'Stacks[0].Outputs[?OutputKey==`oslyn-dev-UserTable-Name`].OutputValue' --output text)
export SONG_TABLE_NAME=$(aws cloudformation describe-stacks --stack-name oslyn-dev --query 'Stacks[0].Outputs[?OutputKey==`oslyn-dev-SongTable-Name`].OutputValue' --output text)
export SETLIST_TABLE_NAME=$(aws cloudformation describe-stacks --stack-name oslyn-dev --query 'Stacks[0].Outputs[?OutputKey==`oslyn-dev-SetListTable-Name`].OutputValue' --output text)
export BAND_TABLE_NAME=$(aws cloudformation describe-stacks --stack-name oslyn-dev --query 'Stacks[0].Outputs[?OutputKey==`oslyn-dev-BandTable-Name`].OutputValue' --output text)
export USER_BAND_MEMBERSHIP_TABLE_NAME=$(aws cloudformation describe-stacks --stack-name oslyn-dev --query 'Stacks[0].Outputs[?OutputKey==`oslyn-dev-UserBandMembershipTable-Name`].OutputValue' --output text)
export BAND_SONG_TABLE_NAME=$(aws cloudformation describe-stacks --stack-name oslyn-dev --query 'Stacks[0].Outputs[?OutputKey==`oslyn-dev-BandSongTable-Name`].OutputValue' --output text)
export BAND_SETLIST_TABLE_NAME=$(aws cloudformation describe-stacks --stack-name oslyn-dev --query 'Stacks[0].Outputs[?OutputKey==`oslyn-dev-BandSetlistTable-Name`].OutputValue' --output text)

echo "Environment variables set:"
echo "USER_TABLE_NAME: $USER_TABLE_NAME"
echo "SONG_TABLE_NAME: $SONG_TABLE_NAME"
echo "SETLIST_TABLE_NAME: $SETLIST_TABLE_NAME"
echo "BAND_TABLE_NAME: $BAND_TABLE_NAME"
echo "USER_BAND_MEMBERSHIP_TABLE_NAME: $USER_BAND_MEMBERSHIP_TABLE_NAME"
echo "BAND_SONG_TABLE_NAME: $BAND_SONG_TABLE_NAME"
echo "BAND_SETLIST_TABLE_NAME: $BAND_SETLIST_TABLE_NAME"

# 4. Run migration
echo "🔄 Step 4: Running migration..."
cd /Users/alexho/oslyn-tabs/aws/scripts
npx ts-node migrate-to-band-access.ts

# 5. Deploy updated resolvers
echo "🔧 Step 5: Deploying updated resolvers..."
cd /Users/alexho/oslyn-tabs/aws
npm run deploy

echo "✅ Band-based access control system deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your frontend to handle band context"
echo "2. Test the new band-based access control"
echo "3. Update your GraphQL queries to include bandId parameter"
echo ""
echo "🎵 Your app now supports:"
echo "- Band-based song and setlist access control"
echo "- O(1) band lookups for users"
echo "- O(n) song access checks (where n = user's band count)"
echo "- Song import between bands"
echo "- Secure access control without exposing user IDs"
