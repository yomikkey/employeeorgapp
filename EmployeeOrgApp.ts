interface Employee {
  uniqueId: number;
  name: string;
  subordinates: Employee[];
}

interface IEmployeeOrgApp {
  ceo: Employee;
  /**
    * Moves the employee with employeeID (uniqueId) under a supervisor
    (another employee) that has supervisorID (uniqueId).
    * E.g. move Bob (employeeID) to be subordinate of Georgina
    (supervisorID). * @param employeeID
    * @param supervisorID
    */
  move(employeeID: number, supervisorID: number): void;
  /** Undo last move action */
  undo(): void;
  /** Redo last undone action */
  redo(): void;
}

interface Operation {
  employeeID: number;
  supervisorID: number;
  subordinates: Employee[];
  undone?: boolean;
}

const ceo: Employee = {
  uniqueId: 1,
  name: "Mark Zuckerberg",
  subordinates: [
    {
      uniqueId: 2,
      name: "Sarah Donald",
      subordinates: [
        {
          uniqueId: 6,
          name: "Cassandra Reynolds",
          subordinates: [
            {
              uniqueId: 11,
              name: "Mary Blue",
              subordinates: [],
            },
            {
              uniqueId: 12,
              name: "Bob Saget",
              subordinates: [
                {
                  uniqueId: 14,
                  name: "Tina Teff",
                  subordinates: [
                    {
                      uniqueId: 15,
                      name: "Will Turner",
                      subordinates: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      uniqueId: 3,
      name: "Tyler Simpson",
      subordinates: [
        {
          uniqueId: 7,
          name: "Harry Tobs",
          subordinates: [
            {
              uniqueId: 13,
              name: "Thomas Brown",
              subordinates: [],
            },
          ],
        },
        {
          uniqueId: 8,
          name: "George Carrey",
          subordinates: [],
        },
        {
          uniqueId: 9,
          name: "Gary Styles",
          subordinates: [],
        },
      ],
    },
    {
      uniqueId: 4,
      name: "Bruce Willis",
      subordinates: [],
    },
    {
      uniqueId: 5,
      name: "Georgina Flangy",
      subordinates: [
        {
          uniqueId: 10,
          name: "Sophie Turner",
          subordinates: [],
        },
      ],
    },
  ],
};

class EmployeeOrgApp implements IEmployeeOrgApp {
  ceo: Employee;
  operations: Operation[] = [];

  constructor(ceo: Employee) {
    console.log("INITIAL:", this.clone(ceo));
    this.ceo = this.clone(ceo);
  }

  clone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };

  findMatchingEmployee = (subordinates: Employee[], uniqueId: number) => {
    for (let i = 0; i < subordinates.length; i++) {
      if (subordinates[i].uniqueId === uniqueId) {
        return subordinates[i];
      }
    }
    return null;
  };

  find = (parent: Employee, uniqueId: number): [Employee, Employee] | null => {
    const subordinates = parent.subordinates;
    let employee = this.findMatchingEmployee(subordinates, uniqueId);
    if (employee) return [employee, parent];
    let i = 0;
    while (i < subordinates.length) {
      const result = this.find(subordinates[i], uniqueId);
      if (result) {
        return result;
      }
      i++;
    }
    return null;
  };

  move(employeeID: number, supervisorID: number) {
    const [employee, employeeParent] = this.find(this.ceo, employeeID) || [];
    const [supervisor] = this.find(this.ceo, supervisorID) || [];
    if (employee && employeeParent && supervisor) {
      // append current operation to operations stack
      const operation: Operation = {
        employeeID,
        supervisorID: employeeParent.uniqueId,
        subordinates: [...employee.subordinates],
      };
      this.operations.push(operation);
      // Move employee's subordinates to employee's parent and rmeove employee from there
      employeeParent.subordinates = [
        ...employeeParent.subordinates,
        ...employee.subordinates,
      ].filter((item) => item.uniqueId !== employee?.uniqueId);
      // Remove subordinates from employee
      employee.subordinates = [];
      // Push employee back to the new supervisor
      supervisor.subordinates.push(employee);
    }
    console.log("FINAL:", {
      ceo: this.clone(this.ceo),
      operations: this.clone(this.operations),
    });
  }

  undo() {
    if (this.operations.length) {
      const index = this.operations.reverse().findIndex((item) => !item.undone);
      if (index !== -1) {
        const { employeeID, supervisorID, subordinates } =
          this.operations[index];
        const [employee, employeeParent] =
          this.find(this.ceo, employeeID) || [];
        const [supervisor] = this.find(this.ceo, supervisorID) || [];
        if (employee && employeeParent && supervisor) {
          // Remove copied subordinates from previous supervisor
          supervisor.subordinates.splice(
            supervisor.subordinates.length - subordinates.length,
            subordinates.length
          );
          // Shift old subordinates back to employee
          employee.subordinates = subordinates;
          // Remove employee from current supervisor
          employeeParent.subordinates.pop();
          // Push employee back to the old supervisor
          supervisor.subordinates.push(employee);
          // Update current operation
          this.operations[index].subordinates = [];
          this.operations[index].supervisorID = employeeParent.uniqueId;
          this.operations[index].undone = true;
        }
      }
      console.log("FINAL:", {
        ceo: this.clone(this.ceo),
        operations: this.clone(this.operations),
      });
    }
  }

  redo() {
    const top = this.operations.length - 1;
    if (this.operations.length && this.operations[top].undone) {
      const { employeeID, supervisorID } = this.operations[top];
      const [employee, employeeParent] = this.find(this.ceo, employeeID) || [];
      const [supervisor] = this.find(this.ceo, supervisorID) || [];
      if (employee && employeeParent && supervisor) {
        // Update current operation
        this.operations[top].supervisorID = employeeParent.uniqueId;
        this.operations[top].subordinates = [...employee.subordinates];
        delete this.operations[top].undone;
        // Move employee's subordinates to employee's parent and rmeove employee from there
        employeeParent.subordinates = [
          ...employeeParent.subordinates,
          ...employee.subordinates,
        ].filter((item) => item.uniqueId !== employee.uniqueId);
        // Remove subordinates from employee
        employee.subordinates = [];
        // Push employee back to the new supervisor
        supervisor.subordinates.push(employee);
      }
    }
    console.log("FINAL:", {
      ceo: this.clone(this.ceo),
      operations: this.clone(this.operations),
    });
  }
}

const app = new EmployeeOrgApp(ceo);

app.move(12, 2);

app.undo();

app.redo();
