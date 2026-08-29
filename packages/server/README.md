# Crate Server

The Crate server authenticates users with ATProto OAuth and stores file metadata and blobs in each user's ATProto repository.

## Setup

For local development, run the server on `127.0.0.1:3030` and the web app on `127.0.0.1:5173`. Set `CRATE_DATA_DIR` to persist OAuth and browser sessions outside the working tree.

Production deployments must expose `/oauth-client-metadata.json`, `/oauth/*`, and `/api/v1/*` from this server. ATProto repositories and their referenced blobs are public data; encrypt private file content before upload.
