import { Profile } from "./profile";
import { ProfileShare } from "./profileShare";

export class ProfileWithShares extends Profile {
    shared_profiles?: ProfileShare[];
    shared_with_me?: ProfileShare[];
  }