# API (owner)

Envelope success:
```
{ success, data, errors, meta: { request_id, operation_id, api_version, schema_version }, engine_versions }
```
errors[].code — central taxonomy; details.featureCode optional.

Every mutation: operationId UUID, commandHash idempotency, Decimal strings.

Capabilities via feature.public-api capabilities().
