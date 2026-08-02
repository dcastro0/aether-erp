CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    payment_method VARCHAR(50),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_org ON financial_transactions(organization_id);
CREATE INDEX idx_financial_order ON financial_transactions(order_id);
