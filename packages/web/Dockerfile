FROM nginx:stable-alpine
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 NGINX_ENVSUBST_FILTER="^NGINX_LOCAL_RESOLVERS$"
COPY packages/web/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY dist/packages/web /usr/share/nginx/html
