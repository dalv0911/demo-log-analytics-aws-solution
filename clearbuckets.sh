#!/bin/bash
echo "Going to delete the following buckets:"
echo "🔴 arn:aws:s3:::david-demo-analytical-logs"
echo "🔴 arn:aws:s3:::david-demo-athena-query-results"
read -p "👺 Are you sure to delete the above buckets permanently (y/n)?" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  aws s3api delete-bucket --bucket david-demo-analytical-logs --region ap-northeast-1 > /dev/null 2>&1
  aws s3api delete-bucket --bucket david-demo-athena-query-results --region ap-northeast-1 > /dev/null 2>&1
  echo "✅ Done."
fi
