"""add rep metric set_number

Revision ID: e5f6a7b8c9d0
Revises: d2e3f4a5b6c7
Create Date: 2026-11-10 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column(
        'rep_metrics',
        sa.Column('set_number', sa.Integer(), server_default='1', nullable=False),
    )
    op.create_check_constraint(
        'ck_rep_metric_set_number',
        'rep_metrics',
        'set_number > 0',
    )

def downgrade() -> None:
    op.drop_constraint('ck_rep_metric_set_number', 'rep_metrics', type_='check')
    op.drop_column('rep_metrics', 'set_number')
