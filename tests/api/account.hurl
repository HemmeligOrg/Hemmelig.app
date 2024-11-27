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

# Get account info
GET http://localhost:3000/api/account
Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
HTTP 200

# Update account
# PUT http://localhost:3000/api/account/update
# Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
# Content-Type: application/json
# {
#     "email":"groot@hemmelig.app",
#     "currentPassword":"iamgroot",
#     "newPassword":"iamgroot",
#     "confirmNewPassword":"iamgroot",
#     "generated":false
# }
# HTTP 200

# Delete account
# POST http://localhost:3000/api/account/delete
# Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
# HTTP 200 