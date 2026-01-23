-- ========================
-- ENUM TYPES
-- ========================
CREATE TYPE delivery_status_enum AS ENUM (
  'awaiting_pickup','in_transit','out_for_delivery','delivered','returned','cancelled'
);

CREATE TYPE order_status_enum AS ENUM (
  'created','confirmed','delivered','cancelled','returned'
);

CREATE TYPE suborder_status_enum AS ENUM (
  'created','confirmed','packed','shipped','delivered','cancelled','returned'
);

CREATE TYPE payment_type_enum AS ENUM ('prepaid','cod','upi','wallet','netbanking');

CREATE TYPE payment_status_enum AS ENUM (
  'pending','success','failed','refunded'
);

CREATE TYPE refund_status_enum AS ENUM (
  'requested','approved','processed','rejected'
);

CREATE TYPE vendor_settlement_status_enum AS ENUM (
  'pending','processing','completed','failed'
);

CREATE TYPE order_item_status_enum AS ENUM (
 'confirmed','cancelled','returned'
);

CREATE TYPE payment_method_enum AS ENUM (
    'card',
    'upi',
    'net_banking',
    'wallet',
    'cod'
);

CREATE TYPE promotion_type_enum AS ENUM (
    'percentage_off',
    'flat_off',
    'bogo',
    'free_shipping'
);


CREATE TYPE promotion_status_enum AS ENUM (
    'draft',
    'active',
    'paused',
    'expired'
);

CREATE TYPE discount_type_enum AS ENUM ('percentage','fixed');

-- ========================
-- USERS & VENDORS
-- ========================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(150) NOT NULL,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    user_phn_no VARCHAR(32),
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor (
    vendor_id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(200) NOT NULL,
    vendor_email VARCHAR(255) UNIQUE NOT NULL,
    vendor_phn_no VARCHAR(32),
    kyc_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_account_details (
    account_id SERIAL PRIMARY KEY,
    vendor_id INTEGER UNIQUE REFERENCES vendor(vendor_id) ON DELETE CASCADE,
    account_no VARCHAR(64),
    ifsc_code VARCHAR(15),
    bank_name VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_profile (
    vendor_profile_id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL UNIQUE REFERENCES vendor(vendor_id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20),
    support_email VARCHAR(255),
    support_phone VARCHAR(20),
    kyc_status VARCHAR(50) DEFAULT 'pending',
    kyc_verified_at TIMESTAMPTZ,
    account_id INTEGER UNIQUE REFERENCES vendor_account_details(account_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



                                                                           


-- ========================
-- CATEGORY & PRODUCT MODULE
-- ========================
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    parent_category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_master (
    product_master_id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(category_id),
    attributes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_product (
    vendor_product_id SERIAL PRIMARY KEY,
    product_master_id INTEGER NOT NULL REFERENCES product_master(product_master_id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendor(vendor_id) ON DELETE CASCADE,
    vendor_product_code VARCHAR(128),
    price NUMERIC(14,2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT vendor_product_unique UNIQUE(product_master_id, vendor_id)
);

CREATE TABLE vendor_product_price_history (
    price_history_id SERIAL PRIMARY KEY,
    vendor_product_id INTEGER NOT NULL REFERENCES vendor_product(vendor_product_id) ON DELETE CASCADE,
    price NUMERIC(14,2) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- WAREHOUSE & INVENTORY
-- ========================
CREATE TABLE warehouse (
    warehouse_id SERIAL PRIMARY KEY,
    warehouse_name VARCHAR(200) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    district VARCHAR(100),
    pincode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    vendor_id INTEGER REFERENCES vendor(vendor_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE inventory (
    vendor_product_id INTEGER NOT NULL REFERENCES vendor_product(vendor_product_id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouse(warehouse_id) ON DELETE CASCADE,
    avl_quantity INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (vendor_product_id, warehouse_id)
);

-- ========================
-- CART
-- ========================
CREATE TABLE carts (
    cart_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    total_amount NUMERIC(14,2) DEFAULT 0
);

CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
    vendor_product_id INTEGER NOT NULL REFERENCES vendor_product(vendor_product_id),
    units INTEGER NOT NULL CHECK (units > 0),
    unit_price NUMERIC(14,2) NOT NULL,
    total_price NUMERIC(14,2) DEFAULT 0,
    added_date TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT cart_items_unique UNIQUE(cart_id, vendor_product_id)
);

-- ========================
-- ADDRESS & PROFILE
-- ========================
CREATE TABLE address (
    address_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50),
    address_line VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India'
);

CREATE TABLE user_profile (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id),
    profile_pic BYTEA,
    default_address INTEGER REFERENCES address(address_id)
);

-- ========================
-- ORDERS / SUBORDERS / ITEMS
-- ========================
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    address_id INTEGER REFERENCES address(address_id),
    ord_status order_status_enum DEFAULT 'created',
    total_amount NUMERIC(14,2) DEFAULT 0,
    discount_amount NUMERIC(14,2) DEFAULT 0,
    ord_date TIMESTAMPTZ DEFAULT NOW(),
    payment_mode VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE suborders (
    suborder_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendor(vendor_id),
    warehouse_id INTEGER REFERENCES warehouse(warehouse_id),
    suborder_total_amount NUMERIC(14,2) DEFAULT 0,
    ord_status suborder_status_enum DEFAULT 'created'
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    suborder_id INTEGER NOT NULL REFERENCES suborders(suborder_id) ON DELETE CASCADE,
    vendor_product_id INTEGER NOT NULL REFERENCES vendor_product(vendor_product_id),
    prod_snapshot_name VARCHAR(250),
    item_price NUMERIC(14,2) NOT NULL,
    units INTEGER NOT NULL,
    item_total NUMERIC(14,2) NOT NULL,
    item_status order_item_status_enum DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE order_status_history (
    history_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    suborder_id INTEGER REFERENCES suborders(suborder_id),
    order_item_id INTEGER REFERENCES order_items(order_item_id),
    status VARCHAR(50),
    changed_by VARCHAR(100),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- DELIVERY
-- ========================
CREATE TABLE delivery (
    shipment_id SERIAL PRIMARY KEY,
    suborder_id INTEGER NOT NULL REFERENCES suborders(suborder_id) ON DELETE CASCADE,
    pickup_address VARCHAR(255),
    delivery_address VARCHAR(255),
    status delivery_status_enum DEFAULT 'awaiting_pickup',
    courier_partner VARCHAR(150),
    tracking_number VARCHAR(150),
    expected_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- PAYMENTS, TRANSACTIONS, REFUNDS, WALLET
-- ========================
CREATE TABLE payment_methods (
    payment_method_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    method_type payment_method_enum NOT NULL,
    provider VARCHAR(100),
    last_four_digits VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER
);


CREATE TABLE payment_transactions (
    txn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id INTEGER REFERENCES orders(order_id) ON DELETE SET NULL,
    amount NUMERIC(14,2) NOT NULL,
    payment_method VARCHAR(50),
    provider_txn_ref VARCHAR(255),
    status payment_status_enum,
    created_on TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id),
    payment_type payment_type_enum,
    payment_status payment_status_enum,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    amount NUMERIC(14,2)
);



CREATE TABLE refunds (
    refund_id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES payments(payment_id),
    payment_txn_id UUID REFERENCES payment_transactions(txn_id),
    order_id INTEGER REFERENCES orders(order_id),
    order_item_id INTEGER REFERENCES order_items(order_item_id),
    amount NUMERIC(14,2),
    status refund_status_enum DEFAULT 'requested',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);


-- ========================
-- SETTLEMENTS & ADJUSTMENTS
-- ========================
CREATE TABLE vendor_settlements (
    settlement_id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendor(vendor_id),
    period_start DATE,
    period_end DATE,
    gross_amount NUMERIC(14,2),
    fees NUMERIC(14,2),
    net_amount NUMERIC(14,2),
    status vendor_settlement_status_enum DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ========================
-- REVIEWS & WISHLIST
-- ========================
CREATE TABLE review (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    vendor_product_id INTEGER REFERENCES vendor_product(vendor_product_id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    review_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wishlist (
    product_master_id INTEGER NOT NULL REFERENCES product_master(product_master_id),
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    added_date TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(product_master_id, user_id)
);

-- ========================
-- AUDIT: ITEM CANCELLATIONS
-- ========================
CREATE TABLE order_item_cancellations (
    cancellation_id SERIAL PRIMARY KEY,
    order_item_id INTEGER NOT NULL REFERENCES order_items(order_item_id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    suborder_id INTEGER NOT NULL REFERENCES suborders(suborder_id) ON DELETE CASCADE,
    cancelled_by VARCHAR(150),
    reason TEXT,
    amount NUMERIC(14,2) NOT NULL,
    units INTEGER NOT NULL,
    cancellation_fee NUMERIC(14,2) DEFAULT 0,
    refund_id INTEGER REFERENCES refunds(refund_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- -----------------------
-- 11) COUPONS
-- -----------------------
CREATE TABLE coupons (
    coupon_id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    discount_type discount_type_enum NOT NULL,
    discount_value NUMERIC(12,4) NOT NULL,
    min_order_amount NUMERIC(14,2) DEFAULT 0,
    max_discount_amount NUMERIC(14,2),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    total_uses_limit INTEGER,
    per_user_limit INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupon_products (
    coupon_id INTEGER NOT NULL REFERENCES coupons(coupon_id) ON DELETE CASCADE,
    product_master_id INTEGER NOT NULL REFERENCES product_master(product_master_id) ON DELETE CASCADE,
    PRIMARY KEY (coupon_id, product_master_id)
);

CREATE TABLE coupon_redemptions (
    redemption_id SERIAL PRIMARY KEY,
    coupon_id INTEGER NOT NULL REFERENCES coupons(coupon_id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    discount_applied NUMERIC(14,2) NOT NULL
);

-- ========================
-- Promos
-- ========================

CREATE TABLE promotions (
    promotion_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    promotion_type promotion_type_enum NOT NULL,
    discount_type discount_type_enum,
    discount_value NUMERIC(14,4),
    min_order_amount NUMERIC(14,2) DEFAULT 0,
    max_discount_amount NUMERIC(14,2),
    vendor_id INTEGER REFERENCES vendor(vendor_id),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    status promotion_status_enum DEFAULT 'draft',
    active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promotion_vendor_products (
    promotion_id INTEGER NOT NULL REFERENCES promotions(promotion_id) ON DELETE CASCADE,
    vendor_product_id INTEGER NOT NULL REFERENCES vendor_product(vendor_product_id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, vendor_product_id)
);

CREATE TABLE order_promotions (
    order_promotion_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    promotion_id INTEGER NOT NULL REFERENCES promotions(promotion_id),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    eligible_amount NUMERIC(14,2) NOT NULL,
    discount_amount NUMERIC(14,2) NOT NULL
);


--Update cart total amount when new units are added--
select * from carts;
select * from cart_items;

CREATE OR REPLACE FUNCTION update_cart_item_total_price()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.total_price:= NEW.units * NEW.unit_price;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER update_cart_item_total_price
BEFORE INSERT OR UPDATE OF units, unit_price ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_cart_item_total_price();


--update cart total based on updation of cart_items--
select * from carts;
CREATE OR REPLACE FUNCTION recalc_cart_total_upsert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE carts
    SET total_amount = (
        SELECT COALESCE(SUM(ci.total_price), 0)
        FROM cart_items ci
        WHERE ci.cart_id = NEW.cart_id
    ),
    updated_at = NOW()
    WHERE cart_id = NEW.cart_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalc_cart_total_upsert
AFTER INSERT OR UPDATE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION recalc_cart_total_upsert();


--update cart total based on updation of cart_items--
CREATE OR REPLACE FUNCTION recalc_cart_total_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE carts
    SET total_amount = (
        SELECT COALESCE(SUM(ci.total_price), 0)
        FROM cart_items ci
        WHERE ci.cart_id = OLD.cart_id
    ),
    updated_at = NOW()
    WHERE cart_id = OLD.cart_id;

    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_recalc_cart_total_delete
AFTER DELETE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION recalc_cart_total_delete();


-- payment flow

CREATE OR REPLACE PROCEDURE handle_payment_on_order(
    p_user_id INT,
    p_address_id INT,
    p_payment_mode VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
DECLARE
    taxn_id INT;
    cart_total NUMERIC;
    new_order_id INT;
    v_cart_id INT;
BEGIN
    p_payment_mode := LOWER(p_payment_mode);

    SELECT cart_id, total_amount
    INTO v_cart_id, cart_total
    FROM carts
    WHERE user_id = p_user_id;

    IF cart_total IS NULL OR cart_total = 0 THEN
        RAISE EXCEPTION 'Cart is empty for user %', p_user_id;
    END IF;

    IF p_payment_mode IN ('upi','prepaid','wallet','netbanking','online') THEN
        INSERT INTO orders(user_id, address_id, total_amount,discount_amount,payment_mode, ord_status)
        VALUES (p_user_id, p_address_id, cart_total,100, p_payment_mode, 'created')
        RETURNING order_id INTO new_order_id;

        INSERT INTO order_status_history(order_id, status, changed_by)
        VALUES (new_order_id, 'created', 'system');

        INSERT INTO payment_transactions(amount, payment_method, status, order_id)
        VALUES (cart_total-100, p_payment_mode, 'pending', new_order_id)
        RETURNING txn_id INTO taxn_id;

    ELSE
        INSERT INTO orders(user_id, address_id, total_amount,discount_amount, payment_mode, ord_status)
        VALUES (p_user_id, p_address_id, cart_total,100, p_payment_mode, 'confirmed')
        RETURNING order_id INTO new_order_id;

        INSERT INTO order_status_history(order_id, status, changed_by)
        VALUES (new_order_id, 'confirmed', 'system');

        INSERT INTO payments(order_id, payment_type, payment_status, amount)
        VALUES (new_order_id, p_payment_mode, 'pending', cart_total-100);
    END IF;

    DELETE FROM cart_items WHERE cart_id = v_cart_id;

    UPDATE carts
    SET total_amount = 0, updated_at = NOW()
    WHERE cart_id = v_cart_id;

END;
$$;

--ON PAYMENT SUCCESS--
CREATE OR REPLACE FUNCTION update_order_on_payment_success()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    p_user INT;
    p_mode VARCHAR(50);
    ord_total NUMERIC;
    v_order_id INT;
BEGIN
    -- Trigger fires only when payment is marked success
    IF NEW.status = 'success' THEN

        -- Fetch transaction details
        SELECT user_id, payment_method, amount, order_id
        INTO p_user, p_mode, ord_total, v_order_id
        FROM payment_transactions
        WHERE payment_transaction_id = NEW.payment_transaction_id;

        -- 1) Update order status → confirmed
        UPDATE orders
        SET ord_status = 'confirmed'
        WHERE order_id = v_order_id;

        -- 2) Insert order status history
        INSERT INTO order_status_history(order_id, status, changed_by)
        VALUES (v_order_id, 'confirmed', 'system');

        -- 3) Insert successful payment record
        INSERT INTO payments(order_id, user_id, payment_type, payment_status, amount)
        VALUES (v_order_id, p_user, p_mode, 'success',
                ord_total);

    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_txn_update
AFTER UPDATE OF status ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_order_on_payment_success();

--Simplified procedure for single-product order--
CREATE OR REPLACE PROCEDURE process_order_after_insert(p_order_id INT)
LANGUAGE plpgsql
AS $$
DECLARE
    p_vendor_id INT;
    p_warehouse_id INT;
    p_price NUMERIC(12,2);
    p_units INT;
    p_vendor_product_id INT;
    p_suborder_id INT;
    p_total_amount NUMERIC(14,2);
BEGIN
    -- Fetch product & units
    SELECT vendor_product_id, units
    INTO p_vendor_product_id, p_units
    FROM temp_order_items
    WHERE order_id = p_order_id;

    -- Fetch price
    SELECT price INTO p_price
    FROM vendor_product
    WHERE vendor_product_id = p_vendor_product_id;

    -- No recalculation — use price * units
    p_total_amount := p_price * p_units;

    -- Vendor ID
    SELECT vendor_id INTO p_vendor_id
    FROM vendor_product
    WHERE vendor_product_id = p_vendor_product_id;

    -- Warehouse with highest stock
    SELECT warehouse_id INTO p_warehouse_id
    FROM inventory
    WHERE vendor_product_id = p_vendor_product_id
    ORDER BY avl_quantity DESC
    LIMIT 1;

    -- Create suborder
    INSERT INTO suborders(order_id, vendor_id, warehouse_id, suborder_total_amount, ord_status)
    VALUES (p_order_id, p_vendor_id, p_warehouse_id, p_total_amount, 'created')
    RETURNING suborder_id INTO p_suborder_id;

    -- Insert item
    INSERT INTO order_items(suborder_id, vendor_product_id, prod_snapshot_name, item_price, units,item_total,item_status)
    SELECT 
        p_suborder_id,
        vp.vendor_product_id,
        vp.vendor_product_code,
        p_price,
        p_units,
		(p_price * p_units)::numeric(14,2), 
		'confirmed'
    FROM vendor_product vp
    WHERE vp.vendor_product_id = p_vendor_product_id;

END;
$$;

--procedure for cart order flow--
CREATE OR REPLACE PROCEDURE place_order_cart_after_insert(
    p_order_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    p_user_id INT;
    cart_total NUMERIC;
    v_suborder_id INT;
    rec RECORD;
BEGIN
    -- 1) User ID
    SELECT user_id INTO p_user_id
    FROM orders
    WHERE order_id = p_order_id;

    -- 2) Cart total (already computed)
    SELECT total_amount INTO cart_total
    FROM carts
    WHERE user_id = p_user_id;

    IF cart_total IS NULL OR cart_total = 0 THEN
        RAISE EXCEPTION 'Cart empty for user %', p_user_id;
    END IF;

    -- 3) Inject cart total into order
    UPDATE orders
    SET total_amount = cart_total
    WHERE order_id = p_order_id;

    -- 4) Suborders grouped by vendor & warehouse
    FOR rec IN (
        WITH cw AS (
            SELECT
                ci.vendor_product_id,
                ci.units,
                ci.unit_price,
                vp.vendor_id,
                (
                    SELECT i.warehouse_id
                    FROM inventory i
                    WHERE i.vendor_product_id = ci.vendor_product_id
                    ORDER BY i.avl_quantity DESC
                    LIMIT 1
                ) AS warehouse_id,
                (ci.units * ci.unit_price) AS total_price
            FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.cart_id
            JOIN vendor_product vp ON vp.vendor_product_id = ci.vendor_product_id
            WHERE c.user_id = p_user_id
        )
        SELECT vendor_id, warehouse_id, SUM(total_price) AS sub_total
        FROM cw
        GROUP BY vendor_id, warehouse_id
    )
    LOOP
        INSERT INTO suborders(order_id, vendor_id, warehouse_id, suborder_total_amount, ord_status)
        VALUES (p_order_id, rec.vendor_id, rec.warehouse_id, rec.sub_total, 'created')
        RETURNING suborder_id INTO v_suborder_id;

        INSERT INTO order_items(suborder_id, vendor_product_id, prod_snapshot_name, item_price, units,item_total,item_status)
        SELECT
            v_suborder_id,
            ci.vendor_product_id,
            vp.vendor_product_code,
            ci.unit_price,
            ci.units,
			ci.total_price,
			'confirmed'
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.cart_id
        JOIN vendor_product vp ON vp.vendor_product_id = ci.vendor_product_id
        WHERE c.user_id = p_user_id
        AND vp.vendor_id = rec.vendor_id;
    END LOOP;

    -- 5) Clear cart
    DELETE FROM cart_items
    WHERE cart_id = (SELECT cart_id FROM carts WHERE user_id = p_user_id);

    UPDATE carts
    SET total_amount = 0,
        updated_at = NOW()
    WHERE user_id = p_user_id;

        INSERT INTO order_status_history(order_id, status, changed_by, changed_at)
        VALUES (v_order_id, 'cancelled', 'system', NOW());
END;
$$;



-- 4) do_refund: process a refund record (mark processed, update payments & orders)
CREATE OR REPLACE PROCEDURE do_refund(
    p_refund_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id INT;
    v_payment_id INT;
    v_refund_amount NUMERIC;
BEGIN
    -- fetch refund row
    SELECT order_id, payment_id, amount INTO v_order_id, v_payment_id, v_refund_amount
    FROM refunds
    WHERE refund_id = p_refund_id;

    IF v_order_id IS NULL AND v_payment_id IS NULL THEN
        RAISE EXCEPTION 'Refund id % not found or missing order/payment', p_refund_id;
    END IF;

    -- mark refund processed
    UPDATE refunds
    SET status = 'processed'
    WHERE refund_id = p_refund_id;

    -- update payment row if exists (mark refunded)
    IF v_payment_id IS NOT NULL THEN
        UPDATE payments
        SET payment_status = 'refunded'
        WHERE payment_id = v_payment_id;
    END IF;

    -- update order status to 'returned' or 'refunded' per your business rule; using 'refunded' here
    UPDATE orders
    SET ord_status = 'returned'
    WHERE order_id = v_order_id;

    -- insert into order_status_history
    INSERT INTO order_status_history(order_id, status, changed_by, changed_at)
    VALUES (v_order_id, 'returned', 'system', now());
END;
$$;



--This will decide whether to call single-product or multi-product procedure--
CREATE OR REPLACE FUNCTION trigger_process_cart_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    item_count INT;
BEGIN
    -- Count items in cart
    SELECT COUNT(*) INTO item_count
    FROM cart_items ci
    JOIN carts c ON c.cart_id = ci.cart_id
    WHERE c.user_id = NEW.user_id;

    IF item_count = 1 THEN
        CALL process_order_after_insert(NEW.order_id);
    ELSE
        CALL place_order_cart_after_insert(NEW.order_id);
    END IF;

    RETURN NEW;
END;
$$;

--Trigger to fire procedures AFTER order is confirmed--
CREATE TRIGGER trg_process_cart_order_on_confirm 
AFTER UPDATE OF ord_status ON orders
FOR EACH ROW
WHEN (
    OLD.ord_status IS DISTINCT FROM NEW.ord_status
    AND NEW.ord_status = 'confirmed'
)
EXECUTE FUNCTION trigger_process_cart_order();

--CHECKING--
select * from carts;
select * from cart_items;
select * from vendor_product;
select * from warehouse;

CALL handle_payment_on_order(5, 3, 'UPI'::VARCHAR);
select * from orders;
select * from payment_transactions;




--SHIPMENT FLOW--
CREATE OR REPLACE PROCEDURE start_shipment(
    p_suborder_id INT,
    p_courier_partner VARCHAR,
    p_expected_date DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_warehouse_address TEXT;
    v_order_id INT;
    v_address_id INT;
    v_delivery_address TEXT;
    v_tracking TEXT;
    v_all_shipped BOOLEAN;
BEGIN
    -- get warehouse address (may be NULL)
    SELECT w.warehouse_address
    INTO v_warehouse_address
    FROM suborders s
    JOIN warehouse w ON w.warehouse_id = s.warehouse_id
    WHERE s.suborder_id = p_suborder_id;

    -- get order_id and address_id for this suborder
    SELECT s.order_id, o.address_id
    INTO v_order_id, v_address_id
    FROM suborders s
    JOIN orders o ON o.order_id = s.order_id
    WHERE s.suborder_id = p_suborder_id;

    -- build a readable delivery address from address parts (handle NULLs)
    SELECT
      COALESCE(a.address_line,'') ||
      CASE WHEN a.city IS NULL THEN '' ELSE ', ' || a.city END ||
      CASE WHEN a.state IS NULL THEN '' ELSE ', ' || a.state END ||
      CASE WHEN a.pincode IS NULL THEN '' ELSE ' - ' || a.pincode END
    INTO v_delivery_address
    FROM address a
    WHERE a.address_id = v_address_id;

    -- generate tracking number (simple deterministic-ish string)
    v_tracking := 'TRK-' || p_suborder_id || '-' || to_char(EXTRACT(EPOCH FROM now())::bigint,'FM999999999999');

    -- insert into delivery table
    INSERT INTO delivery(
        suborder_id,
        pickup_address,
        delivery_address,
        status,
        courier_partner,
        tracking_number,
        expected_date,
        created_at
    )
    VALUES (
        p_suborder_id,
        v_warehouse_address,
        NULLIF(trim(v_delivery_address),''),
        'shipped',
        p_courier_partner,
        v_tracking,
        p_expected_date,
        now()
    );

    -- update the suborder status to shipped
    UPDATE suborders
    SET ord_status = 'shipped'
    WHERE suborder_id = p_suborder_id;

    -- insert status history row for this suborder
    INSERT INTO order_status_history(order_id, suborder_id, status, changed_by, changed_at)
    VALUES (v_order_id, p_suborder_id, 'shipped', 'system', now());

    -- if all suborders for the order are now shipped -> mark order shipped
    SELECT NOT EXISTS (
        SELECT 1 FROM suborders WHERE order_id = v_order_id AND ord_status IS DISTINCT FROM 'shipped'
    ) INTO v_all_shipped;

    IF v_all_shipped THEN
        UPDATE orders
        SET ord_status = 'shipped'
        WHERE order_id = v_order_id;

        -- insert order-level status history
        INSERT INTO order_status_history(order_id, status, changed_by, changed_at)
        VALUES (v_order_id, 'shipped', 'system', now());
    END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE deliver_shipment(
    p_suborder_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id INT;
    v_all_delivered BOOLEAN;
BEGIN
    -- mark delivery row(s) for this suborder as delivered
    UPDATE delivery
    SET status = 'delivered'
    WHERE suborder_id = p_suborder_id;

    -- mark the suborder as delivered
    UPDATE suborders
    SET ord_status = 'delivered'
    WHERE suborder_id = p_suborder_id;

    -- get the order id
    SELECT order_id INTO v_order_id
    FROM suborders
    WHERE suborder_id = p_suborder_id;

    -- mark any payments for this order as success (if not already)
    UPDATE payments
    SET payment_status = 'success'
    WHERE order_id = v_order_id
      AND payment_status IS DISTINCT FROM 'success';

    -- If all suborders for the order are delivered → mark order delivered
    SELECT NOT EXISTS (
        SELECT 1 FROM suborders WHERE order_id = v_order_id AND ord_status IS DISTINCT FROM 'delivered'
    ) INTO v_all_delivered;

    IF v_all_delivered THEN
        UPDATE orders
        SET ord_status = 'delivered'
        WHERE order_id = v_order_id;

        INSERT INTO order_status_history(order_id, status, changed_by, changed_at)
        VALUES (v_order_id, 'delivered', 'system', now());
    ELSE
        -- still insert a suborder delivery history (already inserted above for suborder),
        -- but also add a row marking suborder delivered (if you want both)
        INSERT INTO order_status_history(order_id, suborder_id, status, changed_by, changed_at)
        VALUES (v_order_id, p_suborder_id, 'delivered', 'system', now());
    END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE cancel_order_item(
    p_order_item_id INT,
    p_reason TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id INT;
    v_suborder_id INT;
    v_units INT;
    v_amount NUMERIC;

    v_payment_id INT;
    v_payment_amount NUMERIC;

    v_all_items_cancelled BOOLEAN;
BEGIN
    -------------------------------------------------------------
    -- 1) Get order_id, suborder_id, units, price for the item
    -------------------------------------------------------------
    SELECT suborder_id, item_price, units
    INTO v_suborder_id, v_amount, v_units
    FROM order_items
    WHERE item_id = p_order_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'order_item_id % not found', p_order_item_id;
    END IF;

    SELECT order_id INTO v_order_id
    FROM suborders
    WHERE suborder_id = v_suborder_id;

    -------------------------------------------------------------
    -- 2) Mark order_item as cancelled
    -------------------------------------------------------------
    UPDATE order_items
    SET item_status = 'cancelled'
    WHERE item_id = p_order_item_id;

    -------------------------------------------------------------
    -- 3) Insert into order_item_cancellations
    -------------------------------------------------------------
    INSERT INTO order_item_cancellations (
        order_item_id, order_id, suborder_id,
        cancelled_by, reason, amount, units
    )
    VALUES (
        p_order_item_id,
        v_order_id,
        v_suborder_id,
        'system',
        p_reason,
        v_amount,
        v_units
    );

    -------------------------------------------------------------
    -- 4) Insert order status history
    -------------------------------------------------------------
    INSERT INTO order_status_history(order_id, status, changed_by, changed_at)
    VALUES (v_order_id, 'item_cancelled', 'system', NOW());

    -------------------------------------------------------------
    -- 5) Payment lookup
    -------------------------------------------------------------
    SELECT payment_id, amount
    INTO v_payment_id, v_payment_amount
    FROM payments
    WHERE order_id = v_order_id
    LIMIT 1;

    -------------------------------------------------------------
    -- 6) Create refund row for the cancelled item
    -------------------------------------------------------------
    INSERT INTO refunds(payment_id, order_id, amount, reason, status, created_at)
    VALUES (
        v_payment_id,
        v_order_id,
        v_amount,          -- refund per cancelled item
        p_reason,
        'requested',
        NOW()
    );

    -------------------------------------------------------------
    -- 7) Check if all items in the order are cancelled
    -------------------------------------------------------------
    SELECT bool_and(item_status = 'cancelled')
    INTO v_all_items_cancelled
    FROM order_items oi
    JOIN suborders s ON oi.suborder_id = s.suborder_id
    WHERE s.order_id = v_order_id;

    IF v_all_items_cancelled THEN
        UPDATE orders
        SET ord_status = 'cancelled'
        WHERE order_id = v_order_id;

        INSERT INTO order_status_history(order_id, status, changed_by, changed_at)
        VALUES (v_order_id, 'cancelled', 'system', NOW());
    END IF;

END;
$$;



-- 4) do_refund: process a refund record (mark processed, update payments & orders)
CREATE OR REPLACE PROCEDURE do_refund(
    p_refund_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id INT;
    v_payment_id INT;
    v_refund_amount NUMERIC;
BEGIN
    -- fetch refund row
    SELECT order_id, payment_id, amount INTO v_order_id, v_payment_id, v_refund_amount
    FROM refunds
    WHERE refund_id = p_refund_id;

    IF v_order_id IS NULL AND v_payment_id IS NULL THEN
        RAISE EXCEPTION 'Refund id % not found or missing order/payment', p_refund_id;
    END IF;

    -- mark refund processed
    UPDATE refunds
    SET status = 'processed'
    WHERE refund_id = p_refund_id;

    -- update payment row if exists (mark refunded)
    IF v_payment_id IS NOT NULL THEN
        UPDATE payments
        SET payment_status = 'refunded'
        WHERE payment_id = v_payment_id;
    END IF;

    -- update order status to 'returned' or 'refunded' per your business rule; using 'refunded' here
    UPDATE orders
    SET ord_status = 'returned'
    WHERE order_id = v_order_id;

    -- insert into order_status_history
    INSERT INTO order_status_history(order_id, status, changed_by, changed_at)
    VALUES (v_order_id, 'returned', 'system', now());
END;
$$;

CREATE OR REPLACE PROCEDURE do_refund(
    p_refund_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id INT;
    v_payment_id INT;
    v_refund_amount NUMERIC;

    v_total_refunded NUMERIC;
    v_payment_amount NUMERIC;
BEGIN
    -------------------------------------------------------
    -- 1) Fetch refund details
    -------------------------------------------------------
    SELECT order_id, payment_id, amount
    INTO v_order_id, v_payment_id, v_refund_amount
    FROM refunds
    WHERE refund_id = p_refund_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Refund % not found', p_refund_id;
    END IF;

    -------------------------------------------------------
    -- 2) Mark refund as processed
    -------------------------------------------------------
    UPDATE refunds
    SET status = 'processed',
        processed_at = NOW()
    WHERE refund_id = p_refund_id;

    -------------------------------------------------------
    -- 3) Update payment status only if FULL refund completed
    -------------------------------------------------------
    IF v_payment_id IS NOT NULL THEN
    
        -- original payment amount
        SELECT amount INTO v_payment_amount
        FROM payments
        WHERE payment_id = v_payment_id;

        -- total refunded so far
        SELECT COALESCE(SUM(amount), 0)
        INTO v_total_refunded
        FROM refunds
        WHERE payment_id = v_payment_id
          AND status = 'processed';

        -- if fully refunded → mark as refunded
        IF v_total_refunded >= v_payment_amount THEN
            UPDATE payments
            SET payment_status = 'refunded'
            WHERE payment_id = v_payment_id;
        END IF;

    END IF;

    -------------------------------------------------------
    -- 4) Insert refund event into history logs (optional)
    -------------------------------------------------------
    INSERT INTO order_status_history(order_id, status, changed_by, changed_at)
    VALUES (v_order_id, 'refund_processed', 'system', NOW());

END;
$$;

INSERT INTO users (user_name, user_email, user_phn_no, password_hash, is_verified)
VALUES
('Alice', 'alice@example.com', '9000000001', 'hash1', TRUE),
('Bob', 'bob@example.com', '9000000002', 'hash2', TRUE),
('Charlie', 'charlie@example.com', '9000000003', 'hash3', TRUE),
('David', 'david@example.com', '9000000004', 'hash4', TRUE),
('Eva', 'eva@example.com', '9000000005', 'hash5', TRUE),
('Frank', 'frank@example.com', '9000000006', 'hash6', TRUE),
('Grace', 'grace@example.com', '9000000007', 'hash7', TRUE),
('Henry', 'henry@example.com', '9000000008', 'hash8', TRUE),
('Isabel', 'isabel@example.com', '9000000009', 'hash9', TRUE),
('John', 'john@example.com', '9000000010', 'hash10', TRUE);


INSERT INTO vendor (vendor_name, vendor_email, vendor_phn_no, kyc_status)
VALUES
('TechBazaar', 'vendor1@shop.com', '8888800001', 'verified'),
('GadgetHub', 'vendor2@shop.com', '8888800002', 'verified'),
('HomeWorld', 'vendor3@shop.com', '8888800003', 'verified'),
('StyleStore', 'vendor4@shop.com', '8888800004', 'verified'),
('FreshFoods', 'vendor5@shop.com', '8888800005', 'verified'),
('ElectroMax', 'vendor6@shop.com', '8888800006', 'verified'),
('FashionHub', 'vendor7@shop.com', '8888800007', 'verified'),
('SmartKitchen', 'vendor8@shop.com', '8888800008', 'verified'),
('UrbanDecor', 'vendor9@shop.com', '8888800009', 'verified'),
('EcoLiving', 'vendor10@shop.com', '8888800010', 'verified');

INSERT INTO vendor_account_details (vendor_id, account_no, ifsc_code, bank_name)
VALUES
(1,'111100001','SBIN0001','SBI'),
(2,'111100002','HDFC0002','HDFC'),
(3,'111100003','ICIC0003','ICICI'),
(4,'111100004','SBIN0004','SBI'),
(5,'111100005','HDFC0005','HDFC'),
(6,'111100006','ICIC0006','ICICI'),
(7,'111100007','SBIN0007','SBI'),
(8,'111100008','HDFC0008','HDFC'),
(9,'111100009','ICIC0009','ICICI'),
(10,'111100010','SBIN0010','SBI');


INSERT INTO vendor_profile
(vendor_id, business_name, gst_number, pan_number, address_line1, city, state, country, pincode, support_email, support_phone, kyc_status, account_id)
VALUES
(1,'TechBazaar Pvt Ltd','GST001','PAN001','Street A','Hyderabad','Telangana','India','500001','sup1@vendor.com','8000000001','verified',1),
(2,'GadgetHub Pvt Ltd','GST002','PAN002','Street B','Bangalore','Karnataka','India','560001','sup2@vendor.com','8000000002','verified',2),
(3,'HomeWorld Pvt Ltd','GST003','PAN003','Street C','Mumbai','Maharashtra','India','400001','sup3@vendor.com','8000000003','verified',3),
(4,'StyleStore Pvt Ltd','GST004','PAN004','Street D','Chennai','TN','India','600001','sup4@vendor.com','8000000004','verified',4),
(5,'FreshFoods Pvt Ltd','GST005','PAN005','Street E','Delhi','Delhi','India','110001','sup5@vendor.com','8000000005','verified',5),
(6,'ElectroMax Pvt Ltd','GST006','PAN006','Street F','Pune','Maharashtra','India','411001','sup6@vendor.com','8000000006','verified',6),
(7,'FashionHub Pvt Ltd','GST007','PAN007','Street G','Jaipur','RJ','India','302001','sup7@vendor.com','8000000007','verified',7),
(8,'SmartKitchen Pvt Ltd','GST008','PAN008','Street H','Kochi','Kerala','India','682001','sup8@vendor.com','8000000008','verified',8),
(9,'UrbanDecor Pvt Ltd','GST009','PAN009','Street I','Ahmedabad','Gujarat','India','380001','sup9@vendor.com','8000000009','verified',9),
(10,'EcoLiving Pvt Ltd','GST010','PAN010','Street J','Nagpur','Maharashtra','India','440001','sup10@vendor.com','8000000010','verified',10);


INSERT INTO categories (name)
VALUES
('Mobiles'),
('Laptops'),
('Wearables'),
('Home Appliances'),
('Kitchen'),
('Furniture'),
('Fashion'),
('Groceries'),
('Beauty'),
('Sports');


INSERT INTO product_master (name, description, category_id)
VALUES
('Smartphone A','Android phone',1),
('Laptop B','Gaming laptop',2),
('Smartwatch C','Fitness watch',3),
('Microwave D','900W oven',4),
('Blender E','Kitchen blender',5),
('Dining Table F','Wooden dining table',6),
('T-Shirt G','Cotton T-shirt',7),
('Rice H','Premium rice 5kg',8),
('Face Cream I','Moisturizing cream',9),
('Football J','Standard size football',10);


INSERT INTO vendor_product (product_master_id, vendor_id, vendor_product_code, price)
VALUES
(1,1,'VP-101',35000),
(2,2,'VP-102',65000),
(3,3,'VP-103',12000),
(4,4,'VP-104',9000),
(5,5,'VP-105',4500),
(6,6,'VP-106',25000),
(7,7,'VP-107',500),
(8,8,'VP-108',400),
(9,9,'VP-109',900),
(10,10,'VP-110',1200);



INSERT INTO warehouse (warehouse_name, address_line1, city, state, pincode, vendor_id)
VALUES
('WH-TB-1','Block A','Hyderabad','Telangana','500001',1),
('WH-TB-2','Block B','Hyderabad','Telangana','500002',1),
('WH-GH-1','Sector 5','Bangalore','Karnataka','560001',2),
('WH-HW-1','Area 1','Mumbai','Maharashtra','400001',3),
('WH-SS-1','Area 2','Chennai','TN','600001',4),
('WH-FF-1','Area 3','Delhi','Delhi','110001',5),
('WH-EM-1','Area 4','Pune','Maharashtra','411001',6),
('WH-FH-1','Area 5','Jaipur','RJ','302001',7),
('WH-SK-1','Area 6','Kochi','Kerala','682001',8),
('WH-UD-1','Area 7','Ahmedabad','Gujarat','380001',9);


INSERT INTO inventory (vendor_product_id, warehouse_id, avl_quantity)
VALUES
(1,1,100),
(2,3,50),
(3,4,80),
(4,5,40),
(5,6,120),
(6,7,30),
(7,8,200),
(8,9,150),
(9,10,90),
(10,4,60);


INSERT INTO address (user_id, type, address_line, city, state, pincode, country)
VALUES
(1,'home','Flat 101','Hyderabad','Telangana','500001','India'),
(2,'home','Flat 202','Bangalore','Karnataka','560001','India'),
(3,'home','Flat 303','Chennai','TN','600001','India'),
(4,'home','Flat 404','Mumbai','Maharashtra','400001','India'),
(5,'home','Flat 505','Delhi','Delhi','110001','India'),
(6,'home','Flat 606','Pune','Maharashtra','411001','India'),
(7,'home','Flat 707','Jaipur','RJ','302001','India'),
(8,'home','Flat 808','Kochi','Kerala','682001','India'),
(9,'home','Flat 909','Ahmedabad','Gujarat','380001','India'),
(10,'home','Flat 1001','Nagpur','Maharashtra','440001','India');


-- USER 1 (cart_id = 1)
INSERT INTO cart_items (cart_id, vendor_product_id, units, unit_price)
VALUES
(1, 1, 1, 35000),
(1, 2, 1, 65000),
(1, 3, 1, 12000);

-- USER 2 (cart_id = 2)
INSERT INTO cart_items (cart_id, vendor_product_id, units, unit_price)
VALUES
(2, 4, 1, 9000),
(2, 5, 1, 4500),
(2, 6, 1, 25000);

-- USER 3 (cart_id = 3)
INSERT INTO cart_items (cart_id, vendor_product_id, units, unit_price)
VALUES
(3, 7, 1, 500),
(3, 8, 1, 400),
(3, 9, 1, 900);

-- USER 4 (cart_id = 4)
INSERT INTO cart_items (cart_id, vendor_product_id, units, unit_price)
VALUES
(4, 2, 1, 65000),
(4, 5, 1, 4500),
(4, 8, 1, 400);

-- USER 5 (cart_id = 5)
INSERT INTO cart_items (cart_id, vendor_product_id, units, unit_price)
VALUES
(5, 3, 1, 12000),
(5, 6, 1, 25000),
(5, 9, 1, 900);

-- USER 6 (cart_id = 6)
INSERT INTO cart_items (cart_id, vendor_product_id, units, unit_price)
VALUES
(6, 1, 1, 35000),
(6, 4, 1, 9000),
(6, 7, 1, 500);

-- USER 7 (cart_id = 7)
INSERT INTO cart_items (cart_id, vendor_product_id, units, unit_price)
VALUES
(7, 2, 1, 65000),
(7, 6, 1, 25000),
(7, 10, 1, 1200);

-- USER 8 (cart_id = 8)
INSERT INTO cart_items (cart_id, vendor_product_id, units, unit_price)
VALUES
(8, 3, 1, 12000),
(8, 7, 1, 500),
(8, 10, 1, 1200);

-- USER 9 (cart_id = 9)
INSERT INTO cart_items (cart_id, vendor_product_id, units, unit_price)
VALUES
(9, 1, 1, 35000),
(9, 8, 1, 400),
(9, 9, 1, 900);

-- USER 10 (cart_id = 10)
INSERT INTO cart_items (cart_id, vendor_product_id, units, unit_price)
VALUES
(10, 4, 1, 9000),
(10, 5, 1, 4500),
(10, 10, 1, 1200);


--CHECKING--
select * from carts;
select * from cart_items;
select * from vendor_product;
select * from warehouse;

CALL handle_payment_on_order(5, 3, 'UPI'::VARCHAR);
select * from orders;
select * from payment_transactions;


