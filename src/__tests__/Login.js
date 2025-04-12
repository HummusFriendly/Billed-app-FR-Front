/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES } from "../constants/routes";
import { fireEvent, screen } from "@testing-library/dom";

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
  describe("When I fill fields correctly and click on employee login", () => {
    test("Then I should be identified as an Employee", async () => {
      document.body.innerHTML = LoginUI();
      const inputData = { email: "johndoe@email.com", password: "azerty" };

      fireEvent.change(screen.getByTestId("employee-email-input"), {
        target: { value: inputData.email },
      });
      fireEvent.change(screen.getByTestId("employee-password-input"), {
        target: { value: inputData.password },
      });

      const form = screen.getByTestId("form-employee");
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      
      const store = { login: jest.fn(() => Promise.resolve({ jwt: "1234" })) };
      const login = new Login({ document, localStorage: window.localStorage, onNavigate, PREVIOUS_LOCATION: "", store });
      
      form.addEventListener("submit", (e) => login.handleSubmitEmployee(e));
      fireEvent.submit(form);

      await new Promise((r) => setTimeout(r, 0));
      
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });
  });

  describe("When I fill fields correctly and click on admin login", () => {
    test("Then I should be identified as an Admin", async () => {
      document.body.innerHTML = LoginUI();
      const inputData = { email: "admin@email.com", password: "adminpass" };

      fireEvent.change(screen.getByTestId("admin-email-input"), {
        target: { value: inputData.email },
      });
      fireEvent.change(screen.getByTestId("admin-password-input"), {
        target: { value: inputData.password },
      });

      const form = screen.getByTestId("form-admin");
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      
      const store = { login: jest.fn(() => Promise.resolve({ jwt: "5678" })) };
      const login = new Login({ document, localStorage: window.localStorage, onNavigate, PREVIOUS_LOCATION: "", store });
      
      form.addEventListener("submit", (e) => login.handleSubmitAdmin(e));
      fireEvent.submit(form);

      await new Promise((r) => setTimeout(r, 0));
      
      expect(screen.getByText("Validations")).toBeTruthy();
    });
  });

  describe("When authentication fails", () => {
    test("Then an error message should be displayed for Employee", async () => {
      document.body.innerHTML = LoginUI();
      
      fireEvent.change(screen.getByTestId("employee-email-input"), {
        target: { value: "wrong@email.com" },
      });
      fireEvent.change(screen.getByTestId("employee-password-input"), {
        target: { value: "wrongpass" },
      });

      const form = screen.getByTestId("form-employee");
      const store = { login: jest.fn(() => Promise.reject(new Error("Login failed"))) };
      const login = new Login({ document, localStorage: window.localStorage, onNavigate: jest.fn(), PREVIOUS_LOCATION: "", store });
      
      form.addEventListener("submit", (e) => login.handleSubmitEmployee(e));
      fireEvent.submit(form);

      await new Promise((r) => setTimeout(r, 0));
      
      expect(screen.getByText("Login failed")).toBeTruthy();
    });
  });

  describe("When fields are empty", () => {
    test("Then it should prevent login", () => {
      document.body.innerHTML = LoginUI();
      const form = screen.getByTestId("form-employee");
      const store = { login: jest.fn() };
      const login = new Login({ document, localStorage: window.localStorage, onNavigate: jest.fn(), PREVIOUS_LOCATION: "", store });
      
      const handleSubmit = jest.fn((e) => login.handleSubmitEmployee(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      
      expect(handleSubmit).toHaveBeenCalled();
      expect(store.login).not.toHaveBeenCalled();
    });
  });
});
