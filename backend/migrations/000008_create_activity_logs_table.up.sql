CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    user_name TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
