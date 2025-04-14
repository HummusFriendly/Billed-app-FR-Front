
/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
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
    
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

    onNavigate = jest.fn();
    newBill = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("When I am on NewBill Page", () => {
    test("Then the form should be displayed", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("Then I can upload a valid file", async () => {
      jest.spyOn(mockStore, "bills").mockImplementationOnce(() => ({
        create: jest.fn().mockResolvedValue({
          fileUrl: "https://test.com/image.jpg",
          key: "1234"
        })
      }));

      const fileInput = screen.getByTestId("file");
      const file = new File(["image"], "image.jpg", { type: "image/jpeg" });

      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      fileInput.addEventListener("change", handleChangeFile);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(handleChangeFile).toHaveBeenCalled();
        expect(newBill.fileName).toBe("image.jpg");
      });
    });

    test("Then it should reject an invalid file format", async () => {
      const fileInput = screen.getByTestId("file");
      const file = new File(["document"], "document.pdf", { type: "application/pdf" });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      fileInput.addEventListener("change", handleChangeFile);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(handleChangeFile).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith("Format de fichier non valide. Seuls .jpg, .jpeg, .png sont acceptés.");
        expect(alertSpy).toHaveBeenCalledWith("Veuillez sélectionner un fichier au format .jpg, .jpeg ou .png.");
        expect(fileInput.value).toBe("");
      });

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });

    test("Then submitting the form should call updateBill", async () => {
      newBill.fileName = "image.jpg";
      newBill.fileUrl = "https://test.com/image.jpg";
      newBill.billId = "1234";

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.spyOn(newBill, "handleSubmit");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        handleSubmit(e);
      });

      fireEvent.submit(form);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
      });
    });

    test("Then submitting the form without a valid file should not call updateBill", async () => {
      newBill.fileName = null;
      newBill.fileUrl = null;

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.spyOn(newBill, "handleSubmit");
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        handleSubmit(e);
      });

      fireEvent.submit(form);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith("Veuillez téléverser un justificatif valide (.jpg, .jpeg, .png) avant de soumettre.");
        expect(onNavigate).not.toHaveBeenCalled();
      });

      alertSpy.mockRestore();
    });
  });

  describe("When API fails", () => {
    test("Then it should handle a 404 error", async () => {
      jest.spyOn(mockStore, "bills").mockImplementationOnce(() => ({
        create: () => Promise.reject(new Error("Erreur 404")),
      }));

      const fileInput = screen.getByTestId("file");
      const file = new File(["image"], "image.jpg", { type: "image/jpeg" });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      fileInput.addEventListener("change", handleChangeFile);

      fireEvent.change(fileInput, {
        target: { files: [file] },
        preventDefault: jest.fn(),
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    test("Then it should handle a 500 error", async () => {
      jest.spyOn(mockStore, "bills").mockImplementationOnce(() => ({
        create: () => Promise.reject(new Error("Erreur 500")),
      }));

      const fileInput = screen.getByTestId("file");
      const file = new File(["image"], "image.jpg", { type: "image/jpeg" });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      fileInput.addEventListener("change", handleChangeFile);

      fireEvent.change(fileInput, {
        target: { files: [file] },
        preventDefault: jest.fn(),
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});