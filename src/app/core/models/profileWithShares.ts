import { Profile } from "./profile.model";
import { ProfileShare } from "./profileShare";

export class ProfileWithShares  {
    shared_profiles?: ProfileShare[];
    shared_with_me?: ProfileShare[];
  }