# ==========================================
# BEARS WEEK 2026 - LARAVEL 12 DOCKERFILE
# PHP 8.4 + Extensions + Composer
# ==========================================

FROM php:8.4-fpm-alpine

# Arguments
ARG PHP_VERSION=8.4

# Set working directory
WORKDIR /var/www/html

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    postgresql-dev \
    oniguruma-dev \
    libxml2-dev \
    icu-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    nodejs \
    npm \
    autoconf \
    gcc \
    make \
    g++ \
    linux-headers

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    intl \
    opcache \
    xml \
    soap

# Install Redis extension
RUN pecl install redis \
    && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy PHP configuration
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# Copy application files
COPY . /var/www/html

# Set permissions and create missing directories
RUN mkdir -p /var/www/html/storage/app \
    && mkdir -p /var/www/html/storage/framework/cache/data \
    && mkdir -p /var/www/html/storage/framework/sessions \
    && mkdir -p /var/www/html/storage/framework/views \
    && mkdir -p /var/www/html/storage/logs \
    && mkdir -p /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache \
    && ( [ -f /var/www/html/artisan ] && chmod +x /var/www/html/artisan || true )

# Copy application files again to ensure everything is there
COPY . /var/www/html

# Install dependencies
RUN composer install --optimize-autoloader --no-interaction --no-scripts

# Install Node dependencies
RUN npm install

# Build assets
RUN npm run build

# Expose port 9000
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD php artisan --version || exit 1

# Start PHP-FPM
CMD ["php-fpm"]
