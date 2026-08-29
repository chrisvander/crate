# Kubernetes

## Secrets

Before use, you will need to add the following files:

```
base/backend/firebase.json
base/backend/.dockerconfigjson
base/frontend/.dockerconfigjson
overlays/prod/ssl/cert-patch.json
```

The `firebase.json` is taken directly from Google's Firebase setup. The `.dockerconfigjson` files are copies of a `.docker/config.json` file that has been authenticated with GitHub Container Registry, and contains no other configuration. Finally, you can use the `overlays/prod/ssl/cert-patch.example.json` as an example to create the last file.
