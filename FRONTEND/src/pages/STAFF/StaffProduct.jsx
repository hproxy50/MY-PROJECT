import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Spinner,
  Row,
  Col,
  Alert,
  Offcanvas, 
  Form,
  InputGroup, 
  Badge,
} from "react-bootstrap";
import API from "../../api/api";

export default function StaffProduct() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showSlip, setShowSlip] = useState(false);
  const [importCart, setImportCart] = useState(new Map());
  const [importNote, setImportNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/menu");
      setMenuItems(res.data);
    } catch (err) {
      console.error("Error getting list of dishes:", err);
      setError("Unable to load product list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleAddItem = (item) => {
    setImportCart((prevCart) => {
      const newCart = new Map(prevCart);
      newCart.set(item.item_id, { name: item.name, quantity: 1 }); //auto1
      return newCart;
    });
  };

  const handleRemoveItem = (itemId) => {
    setImportCart((prevCart) => {
      const newCart = new Map(prevCart);
      newCart.delete(itemId);
      return newCart;
    });
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    const newQuantity = Math.max(1, parseInt(quantity) || 1);
    setImportCart((prevCart) => {
      const newCart = new Map(prevCart);
      const item = newCart.get(itemId);
      if (item) {
        newCart.set(itemId, { ...item, quantity: newQuantity });
      }
      return newCart;
    });
  };

  const handleCloseSlip = () => setShowSlip(false);
  const handleShowSlip = () => setShowSlip(true);

  const handleImportSubmit = async () => {
    if (importCart.size === 0) {
      alert("The receipt is empty. Please add products.");
      return;
    }

    setIsSubmitting(true);
    try {
      
      const importRes = await API.post("/import", {
        note: importNote || "Bulk warehouse receipt",
      });
      const import_id = importRes.data.import_id;

      const itemsToSubmit = Array.from(importCart.entries()).map(
        ([item_id, data]) => ({
          item_id: item_id,
          quantity: data.quantity,
        })
      );

      await API.post("/import/add", {
        import_id: import_id,
        items: itemsToSubmit,
      });

      await API.put(`/import/confirm/${import_id}`);

      alert("Bulk import successful!");
      handleCloseSlip();
      setImportCart(new Map());
      setImportNote("");
      fetchMenuItems();
    } catch (err) {
      console.error("Error when importing:", err);
      alert(err.response?.data?.message || "An error occurred while importing");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading products...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="p-3">
          <Row className="justify-content-between align-items-center">
            <Col xs="auto">
              <h3 className="mb-0">Warehouse Management</h3>
            </Col>
            <Col xs="auto" className="d-flex gap-2">
              <Button variant="outline-primary" onClick={fetchMenuItems}>
                Reload
              </Button>
              <Button variant="success" onClick={handleShowSlip}>
                Import
                {importCart.size > 0 && (
                  <Badge pill bg="danger" className="ms-2">
                    {importCart.size}
                  </Badge>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <p className="text-muted">
          Select "Add" to add the product to the bulk receipt.
          </p>
          <Table striped bordered hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Inventory</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => {
                const isItemInCart = importCart.has(item.item_id);
                return (
                  <tr key={item.item_id}>
                    <td>
                      <div className="d-flex align-items-center">
                        {item.image ? (
                          <img
                            src={`http://localhost:3000${item.image}`}
                            alt={item.name}
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              marginRight: "12px",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "50px",
                              height: "50px",
                              backgroundColor: "#f0f0f0",
                              borderRadius: "8px",
                              marginRight: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              color: "#888",
                            }}
                          >
                            No Img
                          </div>
                        )}
                        <span className="fw-semibold">{item.name}</span>
                      </div>
                    </td>
                    <td>{item.food_type}</td>
                    <td>
                      <strong className="fs-5">{item.stock_quantity}</strong>
                    </td>
                    <td>
                      {item.is_available ? (
                        <span className="badge bg-success">In stock</span>
                      ) : (
                        <span className="badge bg-danger">Out of stock</span>
                      )}
                    </td>
                    <td className="text-center">
                      {isItemInCart ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveItem(item.item_id)}
                        >
                          Delete
                        </Button>
                      ) : (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleAddItem(item)}
                        >
                          Add new
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <Offcanvas show={showSlip} onHide={handleCloseSlip} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Warehouse Receipt</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          {importCart.size === 0 ? (
            <div className="text-center text-muted m-auto">
              <p>The import form is blank.</p>
              <small>Please select "Add" from the product table</small>
            </div>
          ) : (
            <>
              <div className="flex-grow-1" style={{ overflowY: "auto" }}>
                <Form.Group className="mb-3">
                  <Form.Label>Note (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={importNote}
                    onChange={(e) => setImportNote(e.target.value)}
                    placeholder="Example: Import the first batch of goods from supplier A"
                  />
                </Form.Group>
                <hr />
                <h5 className="mb-3">Products to be imported</h5>
                <div className="d-flex flex-column gap-3">
                  {Array.from(importCart.entries()).map(
                    ([itemId, itemData]) => (
                      <div key={itemId}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold">{itemData.name}</span>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-0"
                            onClick={() => handleRemoveItem(itemId)}
                          >
                            Delete
                          </Button>
                        </div>
                        <InputGroup>
                          <InputGroup.Text>Quantity</InputGroup.Text>
                          <Form.Control
                            type="number"
                            min="1"
                            value={itemData.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(itemId, e.target.value)
                            }
                            autoFocus={true}
                          />
                        </InputGroup>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="d-grid mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleImportSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" />Loading...
                    </>
                  ) : (
                    `Confirm import of ${importCart.size} item`
                  )}
                </Button>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}