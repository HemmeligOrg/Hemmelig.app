# First sign in as admin
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

# Get admin settings
GET http://localhost:3000/api/admin/settings
Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
HTTP 200

# Update admin settings
PUT http://localhost:3000/api/admin/settings
Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
Content-Type: application/json
{
    "disable_users": false,
    "disable_user_account_creation": false,
    "read_only": false,
    "disable_file_upload": false,
    "restrict_organization_email": ""
}
HTTP 200

# Get users list
GET http://localhost:3000/api/admin/users
Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
HTTP 200

# Create new user as admin
# POST http://localhost:3000/api/admin/users
# Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
# Content-Type: application/json
# {
#     "username": "newuser",
#     "password": "newuserpass",
#     "email": "newuser@example.com",
#     "role": "user",
#     "generated": true
# }
# HTTP 200

# Update user as admin
# PUT http://localhost:3000/api/admin/users
# Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
# Content-Type: application/json
# {
#     "username": "newuser",
#     "email": "updated@example.com",
#     "role": "user"
# }
# HTTP 200

# Delete user as admin
# DELETE http://localhost:3000/api/admin/users
# Cookie: sacred={{sacred_cookie}}; public={{public_cookie}}
# Content-Type: application/json
# {
#     "username": "newuser"
# }
# HTTP 200 