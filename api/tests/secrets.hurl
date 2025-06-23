# Hurl Test for Secret API
#
# This test performs two actions:
# 1. Creates a new secret via a POST request to /v1/secrets.
# 2. Captures the 'id' from the response.
# 3. Deletes the newly created secret using its 'id' via a DELETE request.

# Step 1: Create a new secret.
# We send a POST request with a JSON body containing all the possible fields
# defined by the Zod schema.
POST http://localhost:3000/v1/secrets
Content-Type: application/json
{
    "secret": "This is a highly confidential message that should be protected.",
    "title": "Project Phoenix Launch Codes",
    "password": "super-secure-password-123!",
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "views": 5,
    "isBurnable": true,
    "ipRange": "192.168.1.0/24"
}

# Define what a successful response looks like.
# We expect an HTTP 201 Created status code.
HTTP 201

[Captures]
# Capture the 'id' field from the JSON response body into a variable named 'secretId'.
# We will use this variable in the next request to identify the secret to delete.
secretId: jsonpath "$.id"

[Asserts]
# We assert that the response body is valid JSON.
header "Content-Type" contains "application/json"
# We assert that the 'id' field exists in the response.
jsonpath "$.id" isString
# We assert that the 'secret' field is not returned in the creation response for security.
jsonpath "$.secret" not exists


# Step 2: Delete the secret that was just created.
# We use the 'secretId' variable captured from the previous request in the URL.
# The {{secretId}} syntax is how Hurl injects captured variables.
DELETE http://localhost:3000/v1/secrets/{{secretId}}

# A successful DELETE request should return a 200 OK or 204 No Content.
# We will check for 200 OK here, but you can adjust it to 204 if your API
# returns that instead.
HTTP 200

[Asserts]
# You can add assertions here to check the response body of the delete confirmation,
# for example, if it returns a success message.
# jsonpath "$.message" == "Secret deleted successfully"

