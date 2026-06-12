import { getDefaultOpenCodeAppUrl, getDefaultOpenCodeUrl, getPortalUsersFromEnv, type PortalUserSeed } from "@/lib/env";

const fallbackUsers: PortalUserSeed[] = [
  {
    email: "demo@aimedia.local",
    password: "Demo123456",
    tenantId: "c001",
    tenantName: "演示租户",
    displayName: "演示客户",
    role: "owner",
    methodologyPackKey: "base",
    methodologyPackName: "基础包",
    methodologyPackVersion: "v1",
    opencodeUrl: getDefaultOpenCodeUrl(),
    opencodeAppUrl: getDefaultOpenCodeAppUrl(),
  },
  {
    email: "operator@aimedia.local",
    password: "Operator123456",
    tenantId: "ops",
    tenantName: "运营后台",
    displayName: "运营管理员",
    role: "operator",
    methodologyPackKey: "education",
    methodologyPackName: "教培行业定制包",
    methodologyPackVersion: "v1",
    opencodeUrl: getDefaultOpenCodeUrl(),
    opencodeAppUrl: getDefaultOpenCodeAppUrl(),
  },
];

export function getPortalUsers(): PortalUserSeed[] {
  const envUsers = getPortalUsersFromEnv();
  if (envUsers) return envUsers;

  if (process.env.PORTAL_USERS_JSON) {
    console.warn(
      "[portal] PORTAL_USERS_JSON is set but failed to parse as a valid user array. " +
        "Check the JSON syntax and ensure it is a valid PortalUserSeed[]. " +
        "Falling back to demo users — this is not safe for production.",
    );
  }

  return fallbackUsers;
}
