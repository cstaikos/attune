import { Component, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TitleCasePipe } from "@angular/common";
import { Playlist, Profile } from "../../core/models/library";
import { EnergyChart } from "./energy-chart";
@Component({
  selector: "app-playlist-card",
  imports: [RouterLink, TitleCasePipe, EnergyChart],
  templateUrl: "./playlist-card.html",
})
export class PlaylistCard {
  readonly playlist = input.required<Playlist>();
  readonly creator = input<Profile>();
  readonly saved = input(false);
  readonly busy = input(false);
  readonly save = output<void>();
}
