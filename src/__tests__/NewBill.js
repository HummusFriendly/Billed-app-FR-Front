/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  let newBill;
  let onNavigate;

  beforeEach(() => {
    document.body.innerHTML = NewBillUI();
    
    localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

    onNavigate = jest.fn();
    newBill = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });
  });

  describe("When I am on NewBill Page", () => {
    test("Then the form should be displayed", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("Then I can upload a valid file", async () => {
      const fileInput = screen.getByTestId("file");
      const file = new File(["image"], "image.jpg", { type: "image/jpeg" });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(newBill.fileName).toBe("image.jpg");
    });

    test("Then it should reject an invalid file format", async () => {
      const fileInput = screen.getByTestId("file");
      const file = new File(["document"], "document.pdf", { type: "application/pdf" });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test("Then submitting the form should call updateBill", async () => {
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });

  describe("When API fails", () => {
    test("Then it should handle a 404 error", async () => {
      jest.spyOn(mockStore, "bills").mockImplementation(() => {
        return {
          create: () => Promise.reject(new Error("Erreur 404")),
        };
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["image"], "image.jpg", { type: "image/jpeg" });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(consoleSpy).toHaveBeenCalledWith(new Error("Erreur 404"));

      consoleSpy.mockRestore();
    });

    test("Then it should handle a 500 error", async () => {
      jest.spyOn(mockStore, "bills").mockImplementation(() => {
        return {
          create: () => Promise.reject(new Error("Erreur 500")),
        };
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["image"], "image.jpg", { type: "image/jpeg" });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(consoleSpy).toHaveBeenCalledWith(new Error("Erreur 500"));

      consoleSpy.mockRestore();
    });
  });
});
