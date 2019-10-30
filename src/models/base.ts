export class CrmProp<T> {
  public name: string;
  private control: Xrm.Controls.StandardControl;
  private attribute: Xrm.Attributes.Attribute;

  constructor(propName: string, formContext: Xrm.FormContext) {
    this.name = propName;
    this.control = formContext.getControl<Xrm.Controls.StandardControl>(this.name);
    this.attribute = formContext.getAttribute(this.name);
  }

  public getValue = (): T => this.attribute.getValue();

  public setValue = (value: T): void => this.attribute.setValue(value);

  public addOnChange = (callback: Xrm.Events.ContextSensitiveHandler): void => this.attribute.addOnChange(callback);

  public fireOnChange = (): void => this.attribute.fireOnChange();

  public setDisabled = (disabled: boolean): void => this.control.setDisabled(disabled);

  public setRequiredLevel = (level: Xrm.Attributes.RequirementLevel): void => this.attribute.setRequiredLevel(level);

  public setVisible = (visible: boolean): void => this.control.setVisible(visible);
}

export interface EntityReference {
  id?: string;
  name?: string;
  entityType?: string;
}

export interface IEntity {
  getSetName: () => string;
  getLogicalName: () => string;
}
