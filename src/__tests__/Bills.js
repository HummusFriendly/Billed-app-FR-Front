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

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = bills.sort((a, b) => new Date(a.date) - new Date(b.date));
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then clicking on 'New Bill' button should navigate to NewBill page", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = jest.fn()
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })

      const newBillButton = screen.getByTestId("btn-new-bill")
      fireEvent.click(newBillButton)

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    })

    test("Then clicking on eye icon should open a modal with the bill image", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage })

      $.fn.modal = jest.fn()
      const eyeIcon = screen.getAllByTestId("icon-eye")[0]
      eyeIcon.setAttribute("data-bill-url", "https://test.com/bill.jpg")

      billsInstance.handleClickIconEye(eyeIcon)

      expect($.fn.modal).toHaveBeenCalledWith("show")
      expect(screen.getByRole("img").src).toBe("https://test.com/bill.jpg")
    })

    test("Then getBills should return formatted bills", async () => {
      const mockStore = {
        bills: jest.fn().mockReturnValue({
          list: jest.fn().mockResolvedValue([
            { date: "2023-05-10", status: "pending" },
            { date: "2023-04-10", status: "accepted" },
          ])
        })
      }

      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage })

      const result = await billsInstance.getBills()

      expect(result[0].date).toBe("10 Mai 2023")
      expect(result[1].status).toBe("Accepté")
    })
  })
})
