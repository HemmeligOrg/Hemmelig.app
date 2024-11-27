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

GET http://localhost:3000/api/authentication/verify
Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
HTTP 200

GET http://localhost:3000/api/authentication/refresh
Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
HTTP 200

POST http://localhost:3000/api/authentication/signout
Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
HTTP 200 