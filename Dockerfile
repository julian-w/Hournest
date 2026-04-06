FROM node:20-bookworm AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM php:8.5-apache

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        default-libmysqlclient-dev \
        libcurl4-openssl-dev \
        libonig-dev \
        libpq-dev \
        libsqlite3-dev \
        libxml2-dev \
        unzip \
    && docker-php-ext-install \
        curl \
        mbstring \
        pdo_mysql \
        pdo_pgsql \
        pdo_sqlite \
        xml \
    && a2enmod rewrite headers \
    && sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/000-default.conf \
        /etc/apache2/apache2.conf \
        /etc/apache2/conf-available/*.conf \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/ ./
COPY .env.example ./.env.example
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader

COPY --from=frontend-build /app/frontend/dist/frontend/browser/ ./public/
COPY docker/entrypoint.sh /usr/local/bin/hournest-entrypoint

RUN chmod +x /usr/local/bin/hournest-entrypoint \
    && mkdir -p \
        /var/lib/hournest/database \
        /var/www/html/bootstrap/cache \
        /var/www/html/storage/framework/cache \
        /var/www/html/storage/framework/sessions \
        /var/www/html/storage/framework/views \
        /var/www/html/storage/logs \
    && chown -R www-data:www-data /var/lib/hournest /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
    CMD php -r '$socket = @fsockopen("127.0.0.1", 80, $errno, $errstr, 3); if (!$socket) { exit(1); } fwrite($socket, "GET /up HTTP/1.0\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n"); $response = stream_get_contents($socket); fclose($socket); exit(str_contains($response, "200") ? 0 : 1);'

ENTRYPOINT ["/usr/local/bin/hournest-entrypoint"]
CMD []
