export class PauseMenuState {
  private opened = false;

  public get isOpen(): boolean {
    return this.opened;
  }

  public tryOpen(): boolean {
    if (this.opened) return false;
    this.opened = true;
    return true;
  }

  public close(): boolean {
    if (!this.opened) return false;
    this.opened = false;
    return true;
  }

  public reset(): void {
    this.opened = false;
  }
}
