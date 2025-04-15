/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { fireEvent, screen, waitFor } from "@testing-library/dom";

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("Given that I am a user on login page", () => {
  beforeEach(() => {
    document.body.innerHTML = LoginUI();
    if (!document.querySelector("#error-message-employee")) {
      const errorDiv = document.createElement("div");
      errorDiv.id = "error-message-employee";
      document.querySelector(`form[data-testid="form-employee"]`).appendChild(errorDiv);
    }
    if (!document.querySelector("#error-message-admin")) {
      const errorDiv = document.createElement("div");
      errorDiv.id = "error-message-admin";
      document.querySelector(`form[data-testid="form-admin"]`).appendChild(errorDiv);
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("When I fill fields correctly and click on employee login", () => {
    test("Then I should be identified as an Employee", async () => {
      const inputData = { email: "johndoe@email.com", password: "azerty" };

      fireEvent.change(screen.getByTestId("employee-email-input"), {
        target: { value: inputData.email },
      });
      fireEvent.change(screen.getByTestId("employee-password-input"), {
        target: { value: inputData.password },
      });

      const form = screen.getByTestId("form-employee");
      const onNavigate = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      });

      const store = {
        login: jest.fn(() => Promise.resolve({ jwt: "1234" })),
        users: jest.fn(() => Promise.resolve({ type: "employee" })),
      };
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      form.addEventListener("submit", (e) => login.handleSubmitEmployee(e));
      fireEvent.submit(form);

      await waitFor(() => {
        expect(store.login).toHaveBeenCalledWith(
          JSON.stringify({
            email: inputData.email,
            password: inputData.password,
          })
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith("jwt", "1234");
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "user",
          JSON.stringify({
            type: "Employee",
            email: inputData.email,
            password: inputData.password,
            status: "connected",
          })
        );
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      });
    });
  });

  describe("When I fill fields correctly and click on admin login", () => {
    test("Then I should be identified as an Admin", async () => {
      const inputData = { email: "admin@email.com", password: "adminpass" };

      fireEvent.change(screen.getByTestId("admin-email-input"), {
        target: { value: inputData.email },
      });
      fireEvent.change(screen.getByTestId("admin-password-input"), {
        target: { value: inputData.password },
      });

      const form = screen.getByTestId("form-admin");
      const onNavigate = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      });

      const store = {
        login: jest.fn(() => Promise.resolve({ jwt: "5678" })),
        users: jest.fn(() => Promise.resolve({ type: "admin" })),
      };
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      form.addEventListener("submit", (e) => login.handleSubmitAdmin(e));
      fireEvent.submit(form);

      await waitFor(() => {
        expect(store.login).toHaveBeenCalledWith(
          JSON.stringify({
            email: inputData.email,
            password: inputData.password,
          })
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith("jwt", "5678");
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "user",
          JSON.stringify({
            type: "Admin",
            email: inputData.email,
            password: inputData.password,
            status: "connected",
          })
        );
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Dashboard);
        expect(screen.getByText("Validations")).toBeTruthy();
      });
    });
  });

  describe("When authentication fails", () => {
    test("Then an error message should be displayed for Employee", async () => {
      const inputData = { email: "wrong@email.com", password: "wrongpass" };

      fireEvent.change(screen.getByTestId("employee-email-input"), {
        target: { value: inputData.email },
      });
      fireEvent.change(screen.getByTestId("employee-password-input"), {
        target: { value: inputData.password },
      });

      const form = screen.getByTestId("form-employee");
      const onNavigate = jest.fn();
      const store = {
        login: jest.fn(() => Promise.reject(new Error("Erreur de connexion"))),
        users: jest.fn(() => Promise.resolve({})), // Mock users pour éviter TypeError
      };
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      form.addEventListener("submit", (e) => login.handleSubmitEmployee(e));
      fireEvent.submit(form);

      await waitFor(() => {
        expect(store.login).toHaveBeenCalled();
        expect(document.querySelector("#error-message-employee").textContent).toBe("Erreur de connexion");
        expect(onNavigate).not.toHaveBeenCalled();
      });
    });

    test("Then an error message should be displayed for Admin", async () => {
      const inputData = { email: "wrong@admin.com", password: "wrongpass" };

      fireEvent.change(screen.getByTestId("admin-email-input"), {
        target: { value: inputData.email },
      });
      fireEvent.change(screen.getByTestId("admin-password-input"), {
        target: { value: inputData.password },
      });

      const form = screen.getByTestId("form-admin");
      const onNavigate = jest.fn();
      const store = {
        login: jest.fn(() => Promise.reject(new Error("Erreur de connexion"))),
        users: jest.fn(() => Promise.resolve({})), // Mock users pour éviter TypeError
      };
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      form.addEventListener("submit", (e) => login.handleSubmitAdmin(e));
      fireEvent.submit(form);

      await waitFor(() => {
        expect(store.login).toHaveBeenCalled();
        expect(document.querySelector("#error-message-admin").textContent).toBe("Erreur de connexion");
        expect(onNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe("When fields are empty", () => {
    test("Then it should prevent login for Employee", async () => {
      const form = screen.getByTestId("form-employee");
      const onNavigate = jest.fn();
      const store = {
        login: jest.fn(() => Promise.resolve({ jwt: "1234" })),
        users: jest.fn(() => Promise.resolve({ type: "employee" })),
      };
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      const handleSubmit = jest.fn((e) => login.handleSubmitEmployee(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        expect(store.login).not.toHaveBeenCalled();
        expect(document.querySelector("#error-message-employee").textContent).toBe(
          "Veuillez remplir tous les champs."
        );
        expect(onNavigate).not.toHaveBeenCalled();
      });
    });

    test("Then it should prevent login for Admin", async () => {
      const form = screen.getByTestId("form-admin");
      const onNavigate = jest.fn();
      const store = {
        login: jest.fn(() => Promise.resolve({ jwt: "5678" })),
        users: jest.fn(() => Promise.resolve({ type: "admin" })),
      };
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      const handleSubmit = jest.fn((e) => login.handleSubmitAdmin(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        expect(store.login).not.toHaveBeenCalled();
        expect(document.querySelector("#error-message-admin").textContent).toBe(
          "Veuillez remplir tous les champs."
        );
        expect(onNavigate).not.toHaveBeenCalled();
      });
    });
  });
});