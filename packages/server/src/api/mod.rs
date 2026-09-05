pub mod auth;
pub mod content;
pub mod files;

pub fn service() -> poem_openapi::OpenApiService<impl poem_openapi::OpenApi, ()> {
    poem_openapi::OpenApiService::new(
        (auth::AuthApi, files::FilesApi, content::ContentApi),
        "Crate web companion API",
        "1.0.0",
    )
}
