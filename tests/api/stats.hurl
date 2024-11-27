# Get statistics
GET http://localhost:3000/api/stats
HTTP 200
[Asserts]
jsonpath "$.totalSecretsCreated" exists
jsonpath "$.activeSecrets" exists
jsonpath "$.isPublicSecrets" exists
jsonpath "$.totalUsers" exists
jsonpath "$.totalFiles" exists
jsonpath "$.secretsWithPassword" exists
jsonpath "$.secretsWithIpRestriction" exists
jsonpath "$.averageViewsPerSecret" exists 