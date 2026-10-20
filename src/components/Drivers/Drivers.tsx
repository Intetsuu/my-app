import React, { useEffect, useState } from "react";
import styles from "./Drivers.module.scss";
import {
  fetchDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  DriverInput,
} from "../../api/driversApi";
import { IDriver } from "../../@types/drivers.types";
import { useNavigate } from "react-router";

const emptyForm: DriverInput = {
  full_name: "",
  team_name: "",
  driver_number: 0,
};

const Drivers = () => {
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<DriverInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const loadDrivers = async () => {
    try {
      setError(null);
      const data = await fetchDrivers();
      setDrivers(data);
    } catch {
      setError("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "driver_number" ? Number(value) : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.full_name.trim() ||
      !form.team_name.trim() ||
      form.driver_number <= 0
    ) {
      setError("Enter the driver's name, team, and a number greater than 0");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const data: DriverInput = {
        full_name: form.full_name.trim(),
        team_name: form.team_name.trim(),
        driver_number: form.driver_number,
      };

      if (editingId !== null) {
        const updatedDriver = await updateDriver(editingId, data);

        setDrivers((prev) =>
          prev.map((driver) =>
            driver.id === editingId ? updatedDriver : driver,
          ),
        );
      } else {
        const newDriver = await createDriver(data);
        setDrivers((prev) => [...prev, newDriver]);
      }

      resetForm();
    } catch {
      setError(
        editingId !== null
          ? "Failed to update driver"
          : "Failed to create driver",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (driver: IDriver) => {
    setEditingId(driver.id);
    setForm({
      full_name: driver.full_name,
      team_name: driver.team_name,
      driver_number: driver.driver_number,
    });
    setError(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement>,
    driver: IDriver,
  ) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete ${driver.full_name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await deleteDriver(driver.id);

      setDrivers((prev) => prev.filter((item) => item.id !== driver.id));

      if (editingId === driver.id) {
        resetForm();
      }
    } catch {
      setError("Failed to delete driver");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading drivers...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>F1 Drivers</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <input
          type="text"
          name="full_name"
          placeholder="Driver name"
          value={form.full_name}
          onChange={handleInputChange}
          required
          style={{ padding: "10px" }}
        />

        <input
          type="text"
          name="team_name"
          placeholder="Team name"
          value={form.team_name}
          onChange={handleInputChange}
          required
          style={{ padding: "10px" }}
        />

        <input
          type="number"
          name="driver_number"
          placeholder="Driver number"
          min="1"
          value={form.driver_number || ""}
          onChange={handleInputChange}
          required
          style={{ padding: "10px", width: "130px" }}
        />

        <button
          type="submit"
          disabled={saving}
          style={{ padding: "10px 16px" }}
        >
          {saving
            ? "Saving..."
            : editingId !== null
              ? "Save changes"
              : "Add driver"}
        </button>

        {editingId !== null && (
          <button
            type="button"
            onClick={resetForm}
            style={{ padding: "10px 16px" }}
          >
            Cancel
          </button>
        )}
      </form>

      {error && (
        <p role="alert" style={{ color: "#e10600", marginBottom: "16px" }}>
          {error}
        </p>
      )}

      {drivers.length === 0 ? (
        <p>No drivers found. Add your first driver above.</p>
      ) : (
        <div className={styles.wrapper}>
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className={styles.card}
              onClick={() => navigate(`/drivers/${driver.driver_number}`)}
              style={{
                borderColor: driver.team_colour
                  ? `#${driver.team_colour}`
                  : "#e10600",
                cursor: "pointer",
              }}
            >
              {driver.headshot_url && (
                <img
                  src={driver.headshot_url}
                  alt={driver.full_name}
                  className={styles.image}
                />
              )}

              <div className={styles.info}>
                <span
                  className={styles.number}
                  style={{
                    color: driver.team_colour
                      ? `#${driver.team_colour}`
                      : "#e10600",
                  }}
                >
                  #{driver.driver_number}
                </span>

                <h3>{driver.full_name}</h3>
                <p>{driver.team_name}</p>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "12px",
                  }}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEdit(driver);
                    }}
                    style={{ padding: "6px 10px" }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={(event) => handleDelete(event, driver)}
                    style={{ padding: "6px 10px" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Drivers;
