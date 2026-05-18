#!/bin/bash
# CLIST API テストスクリプト
# 使用方法: ./test-clist-api.sh YOUR_API_KEY

if [ -z "$1" ]; then
  echo "使用方法: $0 <CLIST_API_KEY>"
  echo "CLIST APIキーは https://clist.by/ から取得できます"
  exit 1
fi

API_KEY="$1"
API_BASE="https://clist.by/api/v4"

echo "Testing CLIST API..."
echo "API Key: ${API_KEY:0:8}...${API_KEY: -4}"
echo ""

# AtCoderのコンテストを取得
echo "Fetching AtCoder contests..."
RESPONSE=$(curl -s -H "Authorization: ApiKey $API_KEY" \
  "${API_BASE}/contest/?resource__name=atcoder.jp&upcoming=true&limit=5&order_by=start")

echo "$RESPONSE" | head -100

# コンテスト数を確認
COUNT=$(echo "$RESPONSE" | grep -o '"id"' | wc -l)
echo ""
echo "Found $COUNT contests"
