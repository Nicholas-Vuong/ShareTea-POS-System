INSERT INTO roles (name) VALUES
    ('Customer'),
    ('Cashier'),
    ('Manager')
ON CONFLICT (name) DO NOTHING;

WITH role_ids AS (
    SELECT
        (SELECT id FROM roles WHERE name = 'Customer') AS customer_id,
        (SELECT id FROM roles WHERE name = 'Manager') AS manager_id
)
INSERT INTO users (email, full_name, role_id)
SELECT 'maria.customer@example.com', 'Maria Customer', customer_id FROM role_ids
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, full_name, role_id)
SELECT 'arjun.manager@example.com', 'Arjun Manager', manager_id FROM role_ids
ON CONFLICT (email) DO NOTHING;

INSERT INTO menu_items (name, description, price, category, is_available)
VALUES
    ('Classic Milk Tea', 'Traditional black milk tea', 4.50, 'Milk Tea', TRUE),
    ('Taro Milk Tea', 'Creamy taro flavored milk tea', 5.00, 'Milk Tea', TRUE),
    ('Mango Green Tea', 'Refreshing mango green tea', 4.75, 'Fruit Tea', TRUE),
    ('Brown Sugar Boba', 'Brown sugar milk with tapioca pearls', 5.25, 'Milk Tea', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO inventory_items (name, description, quantity, unit, threshold)
VALUES
    ('Tapioca Pearls', 'Classic boba pearls', 20, 'bags', 5),
    ('Black Tea Leaves', 'Premium Assam black tea', 15, 'bags', 5),
    ('Milk Powder', 'Non-dairy creamer', 25, 'bags', 10)
ON CONFLICT DO NOTHING;
