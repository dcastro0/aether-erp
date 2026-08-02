ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);
CREATE INDEX idx_orders_user ON orders(user_id);
