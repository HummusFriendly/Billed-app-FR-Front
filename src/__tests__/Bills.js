/**
 * @jest-environment jsdom
 */
import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"

jest.mock("../containers/Logout.js", () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock("../app/store", () => ({
  bills: jest.fn(() => ({
    list: jest.fn().mockResolvedValue([
      { date: "2023-05-10", status: "pending" },
      { date: "2023-04-10", status: "accepted" },
    ])
  }))
}))

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
  })

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })

    test("Then bills should be ordered from earliest to latest", async () => {
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: {
          bills: () => ({
            list: () => Promise.resolve(bills),
          }),
        },
        localStorage: window.localStorage,
      });

      const sortedBills = await billsInstance.getBills();
      document.body.innerHTML = BillsUI({ data: sortedBills });
      const dates = screen.getAllByText(/^(0?[1-9]|[12][0-9]|3[01]) (Jan\.|Fév\.|Mar\.|Avr\.|Mai|Juin|Juil\.|Aoû\.|Sep\.|Oct\.|Nov\.|Déc\.) \d\d$/i).map(a => a.innerHTML);
      const datesSorted = [...dates].sort((a, b) => {
        const months = {
          "Jan.": 0, "Fév.": 1, "Mar.": 2, "Avr.": 3, "Mai": 4, "Juin": 5,
          "Juil.": 6, "Aoû.": 7, "Sep.": 8, "Oct.": 9, "Nov.": 10, "Déc.": 11
        };
        const [dayA, monthA, yearA] = a.split(" ");
        const [dayB, monthB, yearB] = b.split(" ");
        return new Date(`20${yearA}-${months[monthA] + 1}-${dayA}`) - new Date(`20${yearB}-${months[monthB] + 1}-${dayB}`);
      });
      expect(dates).toEqual(datesSorted);
    })

    test("Then clicking on 'New Bill' button should navigate to NewBill page", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = jest.fn()
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })

      const newBillButton = screen.getByTestId("btn-new-bill")
      fireEvent.click(newBillButton)

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    })

    test("Then clicking on eye icon should open a modal with the bill image", async () => {
      const modalMock = jest.fn();

      global.$ = global.jQuery = jest.fn(selector => {
        if (selector === '#modaleFile') {
          return {
            width: () => 500,
            find: jest.fn().mockReturnValue({
              html: jest.fn(htmlContent => {
                const modalBody = document.querySelector('.modal-body');
                if (modalBody) {
                  modalBody.innerHTML = htmlContent;
                }
              })
            }),
            modal: modalMock
          };
        }
        return {
          click: jest.fn()
        };
      });

      document.body.innerHTML = `
        <div id="modaleFile" class="modal fade">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-body"></div>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML += BillsUI({ data: bills });

      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });

      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      eyeIcon.setAttribute("data-bill-url", "https://test.com/bill.jpg");

      billsInstance.handleClickIconEye(eyeIcon);

      await waitFor(() => {
        const img = screen.getByRole("img");
        expect(img.src).toBe("https://test.com/bill.jpg");
      });

      expect(modalMock).toHaveBeenCalledWith("show");
    })

    test("Then getBills should return formatted bills", async () => {
      global.$ = global.jQuery = jest.fn().mockReturnValue({
        click: jest.fn()
      });

      const mockStore = {
        bills: jest.fn().mockReturnValue({
          list: jest.fn().mockResolvedValue([
            { date: "2023-05-10", status: "pending" },
            { date: "2023-04-10", status: "accepted" },
          ])
        })
      }

      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      })

      const result = await billsInstance.getBills()

      expect(result[0].date).toBe("10 Avr. 23")
      expect(result[0].status).toBe("Accepté")
      expect(result[1].date).toBe("10 Mai. 23")
      expect(result[1].status).toBe("En attente")
    })
  })
})