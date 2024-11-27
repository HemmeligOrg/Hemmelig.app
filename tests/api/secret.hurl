# First sign in to get auth cookies
POST http://localhost:3000/api/authentication/signin
Content-Type: application/json
{
    "username": "groot",
    "password": "iamgroot"
}
HTTP 200
[Captures]
sacred_cookie: cookie "__HEMMELIG_TOKEN"
public_cookie: cookie "__HEMMELIG_TOKEN_PUBLIC"

# Create a new secret
POST http://localhost:3000/api/secret
Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
Content-Type: application/json
{
    "text": "This is a test secret",
    "title": "Test Secret",
    "ttl": 86400,
    "password": "secretpass",
    "preventBurn": false,
    "maxViews": 1,
    "isPublic": false
}
HTTP 201
[Captures]
secret_id: jsonpath "$.id"

# Check if secret exists
GET http://localhost:3000/api/secret/{{secret_id}}/exist
HTTP 401

# Get secret with password
POST http://localhost:3000/api/secret/{{secret_id}}
Content-Type: application/json
{
    "password": "secretpass"
}
HTTP 200

# Get user's secrets
GET http://localhost:3000/api/secret
Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
HTTP 200

# Create a new public secret
POST http://localhost:3000/api/secret
Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
Content-Type: application/json
{
    "text": "This is a test secret",
    "title": "Test Secret",
    "ttl": 86400,
    "password": "secretpass",
    "preventBurn": false,
    "maxViews": 1,
    "isPublic": true
}
HTTP 201
[Captures]
secret_id_2: jsonpath "$.id"

# Get public secrets
GET http://localhost:3000/api/secret/public/
HTTP 200

# Burn a secret
POST http://localhost:3000/api/secret/{{secret_id_2}}/burn
HTTP 200 