"""add exercise video_url

Revision ID: d2e3f4a5b6c7
Revises: cbbddbbb613f
Create Date: 2026-11-07 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, Sequence[str], None] = 'cbbddbbb613f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('exercises', sa.Column('video_url', sa.String(length=500), nullable=True))

def downgrade() -> None:
    op.drop_column('exercises', 'video_url')
