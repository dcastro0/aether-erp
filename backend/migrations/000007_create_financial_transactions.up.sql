CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'payable' or 'receivable'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'canceled'
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    reference_type VARCHAR(50), -- e.g., 'order'
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_transactions_org ON financial_transactions(organization_id);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_due_date ON financial_transactions(due_date);
