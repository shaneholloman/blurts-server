/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Knex } from "knex";
import { Profile } from "next-auth";
import { Scan } from "./app/functions/server/onerep";
import { ISO8601DateString } from "./utils/parse";
import { StateAbbr } from "./utils/states";
import { RemovalStatus } from "./app/functions/universal/scanResult";
import { BreachDataTypes } from "./app/functions/universal/breach";
import type {
  formatDataClassesArray,
  HibpGetBreachesResponse,
} from "./utils/hibp";
import { DataBrokerRemovalStatus } from "./app/functions/universal/dataBroker";

// See https://knexjs.org/guide/#typescript
declare module "knex/types/tables" {
  interface OnerepDataBrokerRow {
    id: number;
    data_broker: string;
    status: string;
    url: string;
    created_at: Date;
    updated_at: Date;
  }

  interface SubscriberChurnRow {
    userid: string;
    customer: string;
    nickname: string;
    intervl: string;
    plan_id: string;
    product_id: string;
    current_period_end: Date;
  }

  interface OnerepScanResultDataBrokerRow extends OnerepScanResultRow {
    scan_result_status: RemovalStatus;
    broker_status: DataBrokerRemovalStatus;
    url: string;
  }

  interface AttributionRow {
    id: number;
    subscriber_id: number;
    type: string; // first, last touch
    utm_source?: string;
    utm_campaign?: string;
    utm_medium?: string;
    utm_term?: string;
    entrypoint?: string;
    other_utm_parameters?: Record<string, string>;
    created_at: Date;
    updated_at: Date;
  }

  type AttributionOptionalColumns = Extract<
    keyof AttributionRow,
    | "utm_source"
    | "utm_campaign"
    | "utm_medium"
    | "utm_term"
    | "entrypoint"
    | "other_utm_parameters"
  >;
  type AttributionAutoInsertedColumns = Extract<
    keyof AttributionRow,
    "id" | "subscriber_id" | "created_at" | "updated_at"
  >;
  interface FeatureFlagViewRow {
    name: string;
    is_enabled: boolean;
    allow_list?: string[];
    updated_at: Date;
    last_updated_by_subscriber_id: SubscriberRow["id"];
  }

  type FeatureFlagViewOptionalColumns = Extract<
    keyof FeatureFlagViewRow,
    "allow_list"
  >;
  type FeatureFlagViewAutoInsertedColumns = Extract<
    keyof FeatureFlagViewRow,
    "created_at"
  >;

  interface FeatureFlagEventRow {
    name: string;
    is_enabled: boolean;
    allow_list?: string[];
    created_at: Date;
    created_by_subscriber_id: SubscriberRow["id"];
  }

  type FeatureFlagEventOptionalColumns = Extract<
    keyof FeatureFlagEventRow,
    "allow_list"
  >;
  type FeatureFlagEventAutoInsertedColumns = Extract<
    keyof FeatureFlagEventRow,
    "created_at"
  >;

  interface SubscriberEmail {
    id: number;
    email: string;
  }

  export type BreachResolutionChecked = {
    resolutionsChecked: Array<
      (typeof BreachDataTypes)[keyof typeof BreachDataTypes]
    >;
  };

  export type SubscriberBreachResolution = {
    [key: BreachRow.id]: BreachResolutionChecked;
  };

  type BreachResolution = null | {
    useBreachId: boolean;
    [key: SubscriberEmail["email"]]: SubscriberBreachResolution;
  };

  interface SubscriberRow {
    id: number;
    primary_sha1: string;
    primary_email: string;
    primary_verification_token: string;
    primary_verified: boolean;
    created_at: Date;
    updated_at: Date;
    fx_newsletter: boolean;
    signup_language: null | string;
    fxa_refresh_token: null | string;
    fxa_access_token: null | string;
    fxa_session_expiry: null | Date;
    fxa_profile_json: null | Profile;
    fxa_uid: null | string;
    // TODO: Find unknown type

    breaches_last_shown: Date;
    // NOTE: this field is inherited from an older version of the product, it only applies to instant alerts
    all_emails_to_primary: boolean | null; // added  null in MNTOR-1368
    // TODO: Find unknown type

    breaches_resolved: null | unknown;
    // TODO: Find unknown type

    waitlists_joined: null | unknown;
    breach_stats: null | {
      passwords: { count: number; numResolved: number };
      numBreaches: {
        count: number;
        numResolved: number;
        numUnresolved: number;
      };
      monitoredEmails: { count: number };
    };
    monthly_email_at: ISO8601DateString;
    monthly_email_optout: boolean;
    monthly_monitor_report_at: null | Date;
    monthly_monitor_report: boolean;
    breach_resolution: BreachResolution;
    onerep_profile_id: null | number;
    sign_in_count: null | number;
    email_addresses: SubscriberEmail[];
    first_broker_removal_email_sent: boolean;
    churn_prevention_email_sent_at: null | Date;
  }
  type SubscriberOptionalColumns = Extract<
    keyof SubscriberRow,
    | "fx_newsletter"
    | "fxa_access_token"
    | "fxa_refresh_token"
    | "fxa_session_expiry"
    | "fxa_profile_json"
    | "fxa_uid"
    | "breaches_last_shown"
    | "all_emails_to_primary"
    | "breaches_resolved"
    | "waitlists_joined"
    | "breach_stats"
    | "monthly_email_at"
    | "monthly_email_optout"
    | "monthly_monitor_report_at"
    | "monthly_monitor_report"
    | "breach_resolution"
    | "onerep_profile_id"
    | "email_addresses"
    | "first_broker_removal_email_sent"
    | "churn_prevention_email_sent_at"
  >;
  type SubscriberAutoInsertedColumns = Extract<
    keyof SubscriberRow,
    "id" | "created_at" | "updated_at" | "sign_in_count"
  >;

  interface EmailAddressRow {
    id: number;
    subscriber_id: SubscriberRow["id"];
    sha1: string;
    email: string;
    verification_token: string;
    verified: boolean;
    created_at: Date;
    updated_at: Date;
  }
  type EmailAddressAutoInsertedColumns = Extract<
    keyof EmailAddressRow,
    "id" | "created_at" | "updated_at"
  >;

  interface SubscriberCouponRow {
    id: number;
    subscriber_id: number;
    coupon_code: string;
    created_at: Date;
  }
  type SubscriberCouponAutoInsertedColumns = Extract<
    keyof SubscriberCouponRow,
    "id" | "subscriber_id" | "created_at"
  >;

  interface SubscriberEmailPreferencesRow {
    id: number;
    subscriber_id: number;
    unsubscribe_token: string | null;
    monthly_monitor_report_free: boolean | null;
    monthly_monitor_report_free_at: Date | null;
  }

  interface BreachRow {
    id: number;
    name: HibpGetBreachesResponse[number]["Name"];
    title: HibpGetBreachesResponse[number]["Title"];
    domain: HibpGetBreachesResponse[number]["Domain"];
    breach_date: Date;
    /** Note: added_date is provided by HIBP; this is not the equivalent to created_at in other tables */
    added_date: Date;
    /** Note: modified_date is provided by HIBP; this is not the equivalent to updated_at in other tables */
    modified_date: Date;
    pwn_count: HibpGetBreachesResponse[number]["PwnCount"];
    description: null | HibpGetBreachesResponse[number]["Description"];
    logo_path: string;
    data_classes: ReturnType<typeof formatDataClassesArray>;
    is_verified: HibpGetBreachesResponse[number]["IsVerified"];
    is_fabricated: HibpGetBreachesResponse[number]["IsFabricated"];
    is_sensitive: HibpGetBreachesResponse[number]["IsSensitive"];
    is_retired: HibpGetBreachesResponse[number]["IsRetired"];
    is_spam_list: HibpGetBreachesResponse[number]["IsSpamList"];
    is_malware: HibpGetBreachesResponse[number]["IsMalware"];
    favicon_url: null | string;
  }
  type BreachOptionalColumns = Extract<
    keyof BreachRow,
    "domain" | "description"
  >;
  type BreachAutoInsertedColumns = Extract<keyof BreachRow, "id">;

  interface OnerepScanRow {
    id: number;
    onerep_profile_id: number;
    onerep_scan_id: number;
    onerep_scan_reason: Scan["reason"];
    onerep_scan_status: Scan["status"];
    created_at: Date;
    updated_at: Date;
  }
  type OnerepScanOptionalColumns = Extract<
    keyof OnerepScanRow,
    "onerep_profile_id"
  >;
  type OnerepScanAutoInsertedColumns = Extract<
    keyof OnerepScanRow,
    "id" | "created_at" | "updated_at"
  >;

  interface OnerepScanResultRow {
    id: number;
    onerep_scan_result_id: number;
    onerep_scan_id: OnerepScanRow["onerep_scan_id"];
    link: string;
    age?: number;
    data_broker: string;
    data_broker_id: number;
    emails: string[];
    phones: string[];
    addresses: Array<{
      city: string;
      state: StateAbbr;
      street?: string;
      zip?: string;
    }>;
    relatives: string[];
    first_name: string;
    middle_name?: string;
    last_name: string;
    status: RemovalStatus;
    optout_attempts?: number;
    last_optout_at?: Date;
    manually_resolved: boolean;
    created_at: Date;
    updated_at: Date;
  }
  type OnerepScanResultOptionalColumns = Extract<
    keyof OnerepScanResultRow,
    "manually_resolved" | "middle_name" | "optout_attempts" | "last_optout_at"
  >;
  type OnerepScanResultSerializedColumns = Extract<
    keyof OnerepScanResultRow,
    "emails" | "phones" | "addresses" | "relatives"
  >;
  type OnerepScanResultAutoInsertedColumns = Extract<
    keyof OnerepScanResultRow,
    "id" | "created_at" | "updated_at"
  >;

  type OnerepProfileAddress = {
    city: string;
    state: StateAbbr;
  };

  interface OnerepProfileRow {
    id: number;
    onerep_profile_id: null | number;
    name_suffix: null | string;
    first_name: string;
    middle_name: null | string;
    last_name: string;
    first_names: string[];
    middle_names: string[];
    last_names: string[];
    addresses: OnerepProfileAddress[];
    phone_numbers: E164PhoneNumberString[];
    date_of_birth: Date;
    created_at: Date;
    updated_at: Date;
    // For backwards compatibility reasons we are keeping `city_name` and
    // `state_code` until MNTOR-3567 is implemented and enabled by default.
    /** @deprecated Please use `addresses` instead. */
    city_name: string;
    /** @deprecated Please use `addresses` instead. */
    state_code: StateAbbr;
  }
  type OnerepProfileOptionalColumns = Extract<
    keyof OnerepProfileRow,
    "onerep_profile_id"
  >;
  type OnerepProfileAutoInsertedColumns = Extract<
    keyof OnerepProfileRow,
    "id" | "created_at" | "updated_at"
  >;

  interface EmailNotificationRow {
    id: number;
    subscriber_id: number;
    breach_id: number;
    appeared: boolean;
    notified: boolean;
    email: string;
    notification_type: string;
    created_at: Date;
    updated_at: Date;
  }
  type EmailNotificationAutoInsertedColumns = Extract<
    keyof EmailNotificationRow,
    "id" | "created_at" | "updated_at"
  >;

  interface StatsRow {
    id: number;
    name: string;
    current: string;
    max: string;
    type: string;
    created_at: Date;
    modified_at: Date;
  }
  type StatsAutoInsertedColumns = Extract<
    keyof StatsRow,
    "id" | "created_at" | "modified_at"
  >;

  type AudienceRow =
    | "all_users"
    | "premium_users"
    | "free_users"
    | "has_run_scan"
    | "has_not_run_scan"
    | "monthly_user"
    | "yearly_user"
    | "bundle_user"
    | "premium_non_bundle"
    | "non_us"
    | "us_only";

  interface AnnouncementRow {
    id: number;
    announcement_id: string;
    title: string;
    description: string;
    small_image_path: string;
    big_image_path: string;
    cta_label?: string;
    cta_link?: string;
    audience: AudienceRow;
    created_at: Date;
    updated_at: Date;
    label: string;
  }

  type AnnouncementRowInsertedColumns =
    | "id"
    | "created_at"
    | "updated_at"
    | "audience"
    | "small_image_path"
    | "big_image_path"
    | "title"
    | "description";
  type AnnouncementRowOptionalColumns =
    | "announcement_id"
    | "cta_label"
    | "cta_link";

  interface UserAnnouncementsRow {
    id: number;
    user_id: number;
    announcement_id: string;
    status: string;
    seen_at: Date;
    cleared_at: Date;
    clicked_at: Date;
    created_at: Date;
    updated_at: Date;
  }

  /**
   * This modifies row types to indicate that dates can also be inserted as ISO
   * 8601 strings, not just Date objects (which will be returned on SELECT queries)
   */
  type WritableDateColumns<Row extends object> = {
    [FieldName in keyof Row]: Exclude<Row[FieldName], undefined> extends Date
      ? ISO8601DateString | Date
      : Row[FieldName];
  };

  interface Tables {
    attributions: Knex.CompositeTableType<
      AttributionRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional:
      WritableDateColumns<
        Omit<
          AttributionRow,
          AttributionAutoInsertedColumns | AttributionOptionalColumns
        > &
          Partial<Pick<AttributionRow, AttributionOptionalColumns>>
      >,
      // On updates, don't allow updating the ID and created date; all other fields are optional, except updated_at:
      WritableDateColumns<
        Partial<Omit<AttributionRow, "id" | "created_at">> &
          Pick<AttributionRow, "updated_at">
      >
    >;

    notifications: Knex.CompositeTableType<
      AnnouncementRow,
      WritableDateColumns<
        Omit<
          AnnouncementRow,
          NotificationAutoInsertedColumns | NotificationOptionalColumns
        > &
          Partial<Pick<AnnouncementRow, NotificationOptionalColumns>>
      >,
      // On updates, don't allow updating the ID and created date
      WritableDateColumns<
        Partial<Omit<AnnouncementRow, "id" | "created_at">> &
          Pick<AnnouncementRow, "updated_at">
      >
    >;

    feature_flag_view: Knex.CompositeTableType<
      FeatureFlagViewRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional:
      WritableDateColumns<
        Omit<
          FeatureFlagViewRow,
          FeatureFlagViewAutoInsertedColumns | FeatureFlagViewOptionalColumns
        > &
          Partial<Pick<FeatureFlagViewRow, FeatureFlagViewOptionalColumns>>
      >,
      // Don't allow updates; updating a flag requires adding a new event.
      // This allows us to make sure all updates are auditable.
      Record<string, never>
    >;

    feature_flag_events: Knex.CompositeTableType<
      FeatureFlagEventRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional:
      WritableDateColumns<
        Omit<
          FeatureFlagEventRow,
          FeatureFlagEventAutoInsertedColumns | FeatureFlagEventOptionalColumns
        > &
          Partial<Pick<FeatureFlagEventRow, FeatureFlagEventOptionalColumns>>
      >,
      // Don't allow updates; updating a flag requires adding a new event.
      // This allows us to make sure all updates are auditable.
      Record<string, never>
    >;

    subscribers: Knex.CompositeTableType<
      SubscriberRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional.
      WritableDateColumns<
        Omit<
          SubscriberRow,
          SubscriberAutoInsertedColumns | SubscriberOptionalColumns
        > &
          Partial<Pick<SubscriberRow, SubscriberOptionalColumns>>
      >,
      // On updates, don't allow updating the ID and created date; all
      WritableDateColumns<
        // otherfields are optional, except updated_at:
        Partial<Omit<SubscriberRow, "id" | "created_at">> &
          Pick<SubscriberRow, "updated_at">
      >
    >;

    subscriber_coupons: Knex.CompositeTableType<
      SubscriberCouponRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional:
      WritableDateColumns<
        Omit<SubscriberCouponRow, SubscriberAutoInsertedColumns>
      >,
      // On updates, don't allow updating the ID; all other fields are optional:
      WritableDateColumns<Partial<Omit<SubscriberCouponRow, "id">>>
    >;

    subscriber_churns: SubscriberChurnRow;

    subscriber_email_preferences: Knex.CompositeTableType<
      SubscriberEmailPreferencesRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional:
      WritableDateColumns<Omit<SubscriberEmailPreferencesRow, "id">>,
      // On updates, don't allow updating the ID; all other fields are optional:
      WritableDateColumns<Partial<Omit<SubscriberEmailPreferencesRow, "id">>>
    >;

    email_addresses: Knex.CompositeTableType<
      EmailAddressRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional:
      WritableDateColumns<
        Omit<EmailAddressRow, EmailAddressAutoInsertedColumns>
      >,
      // On updates, don't allow updating the ID and created date; all other fields are optional, except updated_at:
      WritableDateColumns<
        Partial<Omit<EmailAddressRow, "id" | "created_at">> &
          Pick<EmailAddressRow, "updated_at">
      >
    >;

    breaches: Knex.CompositeTableType<
      BreachRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional:
      WritableDateColumns<
        Omit<BreachRow, BreachAutoInsertedColumns | BreachOptionalColumns> &
          Partial<Pick<BreachRow, BreachOptionalColumns>>
      >,
      // On updates, don't allow updating the ID; all other fields are optional:
      WritableDateColumns<Partial<Omit<BreachRow, "id">>>
    >;

    onerep_scans: Knex.CompositeTableType<
      OnerepScanRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional:
      WritableDateColumns<
        Omit<
          OnerepScanRow,
          OnerepScanAutoInsertedColumns | OnerepScanOptionalColumns
        > &
          Partial<Pick<OnerepScanRow, OnerepScanOptionalColumns>>
      >,
      // On updates, don't allow updating the ID and created date; all other fields are optional, except updated_at:
      WritableDateColumns<
        Partial<Omit<OnerepScanRow, "id" | "created_at">> &
          Pick<OnerepScanRow, "updated_at">
      >
    >;

    onerep_scan_results: Knex.CompositeTableType<
      OnerepScanResultRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional:
      WritableDateColumns<
        Omit<
          OnerepScanResultRow,
          | OnerepScanResultAutoInsertedColumns
          | OnerepScanResultOptionalColumns
          | OnerepScanResultSerializedColumns
        > &
          Partial<Pick<OnerepScanResultRow, OnerepScanResultOptionalColumns>> &
          Record<OnerepScanResultSerializedColumns, string>
      >,
      // On updates, don't allow updating the ID and created date; all other fields are optional, except updated_at:
      WritableDateColumns<
        Partial<Omit<OnerepScanResultRow, "id" | "created_at">> &
          Pick<OnerepScanResultRow, "updated_at"> &
          Record<OnerepScanResultSerializedColumns, string>
      >
    >;

    onerep_profiles: Knex.CompositeTableType<
      OnerepProfileRow,
      // On inserts, auto-generated columns cannot be set, and nullable columns are optional:
      WritableDateColumns<
        Omit<
          OnerepProfileRow,
          OnerepProfileAutoInsertedColumns | OnerepProfileOptionalColumns
        > &
          Partial<Pick<OnerepProfileRow, OnerepProfileOptionalColumns>>
      >,
      // On updates, don't allow updating the ID and created date; all other fields are optional, except updated_at:
      WritableDateColumns<
        Partial<Omit<OnerepProfileRow, "id" | "created_at">> &
          Pick<OnerepProfileRow, "updated_at">
      >
    >;

    email_notifications: Knex.CompositeTableType<
      EmailNotificationRow,
      // On inserts, auto-generated columns cannot be set:
      WritableDateColumns<
        Omit<EmailNotificationRow, EmailAddressAutoInsertedColumns> &
          Partial<EmailNotificationRow>
      >,
      // On updates, don't allow updating the ID and created date; all other fields are optional, except updated_at:
      WritableDateColumns<
        Partial<Omit<EmailNotificationRow, "id" | "created_at">> &
          Pick<EmailNotificationRow, "updated_at">
      >
    >;

    stats: Knex.CompositeTableType<
      StatsRow,
      // On inserts, auto-generated columns cannot be set:
      WritableDateColumns<
        Omit<StatsRow, StatsAutoInsertedColumns> & Partial<StatsRow>
      >,
      // On updates, don't allow updating the ID and created date; all other fields are optional, except modified_at:
      WritableDateColumns<
        Partial<Omit<StatsRow, "id" | "created_at">> &
          Pick<StatsRow, "modified_at">
      >
    >;

    onerep_data_brokers: Knex.CompositeTableType<
      OnerepDataBrokerRow,
      // On inserts, auto-generated columns cannot be set
      WritableDateColumns<
        Omit<OnerepDataBrokerRow, DataBrokerAutoInsertedColumns>
      >,
      // On updates, don't allow updating the ID and created date; all other fields are optional, except updated_at
      WritableDateColumns<
        Partial<Omit<OnerepDataBrokerRow, "id" | "created_at">> &
          Pick<OnerepDataBrokerRow, "updated_at">
      >
    >;

    onerep_scan_results_data_brokers: Knex.CompositeTableType<
      OnerepScanResultDataBrokerRow,
      // On inserts, auto-generated columns cannot be set
      WritableDateColumns<
        Omit<OnerepScanResultDataBrokerRow, OnerepScanResultAutoInsertedColumns>
      >,
      // On updates, don't allow updating the ID and created date; all other fields are optional, except updated_at
      WritableDateColumns<
        Partial<Omit<OnerepScanResultDataBrokerRow, "id" | "created_at">> &
          Pick<OnerepScanResultDataBrokerRow, "updated_at">
      >
    >;
  }
}

interface GoogleAnalyticsClientsRow {
  id: number;
  subscriber_id: number;
  cookie_version: string;
  cookie_path: string;
  client_id: string;
  cookie_timestamp: Date;
}
