from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import settings
from app.database.connection import Base

# Import all models so SQLAlchemy registers all eight tables.
import app.models


config = context.config

# Configure Alembic logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata used by Alembic autogenerate.
target_metadata = Base.metadata
migration_database_url = settings.MIGRATION_DATABASE_URL or settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Run migrations without creating a database connection."""

    context.configure(
        url=migration_database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations using the configured database connection."""

    connectable = create_engine(
        migration_database_url,
        poolclass=pool.NullPool,
        pool_pre_ping=True,
    )

    try:
        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                compare_type=True,
                compare_server_default=True,
            )

            with context.begin_transaction():
                context.run_migrations()
    finally:
        connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
