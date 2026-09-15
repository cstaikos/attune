import { UI_BUTTONS } from "../../shared/ui/native-button";
import { Component } from "@angular/core";
import { TitleCasePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { noteGroups } from "../../core/data/ui-options";
@Component({
  selector: "app-guide-page",
  imports: [...UI_BUTTONS, TitleCasePipe, RouterLink],
  templateUrl: "./guide-page.html",
})
export class GuidePage {
  readonly groups = noteGroups;
}
