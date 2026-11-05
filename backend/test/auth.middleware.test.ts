import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Response } from "express";
import { createToken, requireAuth, requireRole, type AuthenticatedRequest } from "../src/middleware/auth.middleware";

process.env.JWT_SECRET = "test-secret";

function responseMock() {
  let statusCode = 200;
  let body: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return response;
    },
    json(value: unknown) {
      body = value;
      return response;
    },
  } as unknown as Response;
  return { response, getResult: () => ({ statusCode, body }) };
}

function requestMock(authorization?: string) {
  return { headers: authorization ? { authorization } : {} } as AuthenticatedRequest;
}

test("requireAuth rejects requests without a bearer token", () => {
  const { response, getResult } = responseMock();
  let called = false;

  requireAuth(requestMock(), response, (() => { called = true }) as NextFunction);

  assert.equal(getResult().statusCode, 401);
  assert.equal(called, false);
});

test("requireAuth accepts a valid token and attaches the user", () => {
  const token = createToken(7, 2, "Yönetici");
  const request = requestMock(`Bearer ${token}`);
  const { response, getResult } = responseMock();
  let called = false;

  requireAuth(request, response, (() => { called = true }) as NextFunction);

  assert.equal(called, true);
  assert.deepEqual(request.kullanici, { id: 7, rol_id: 2, rol_adi: "Yönetici" });
  assert.equal(getResult().statusCode, 200);
});

test("requireAuth rejects malformed tokens", () => {
  const { response, getResult } = responseMock();

  requireAuth(requestMock("Bearer not-a-real-token"), response, (() => {}) as NextFunction);

  assert.equal(getResult().statusCode, 401);
});

test("requireRole allows only configured roles", () => {
  const allowedRequest = requestMock();
  allowedRequest.kullanici = { id: 1, rol_id: 2, rol_adi: "Yönetici" };
  const allowedResponse = responseMock();
  let allowedNext = false;
  requireRole("Yönetici")(allowedRequest, allowedResponse.response, (() => { allowedNext = true }) as NextFunction);

  const deniedRequest = requestMock();
  deniedRequest.kullanici = { id: 2, rol_id: 3, rol_adi: "Depo Sorumlusu" };
  const deniedResponse = responseMock();
  let deniedNext = false;
  requireRole("Yönetici")(deniedRequest, deniedResponse.response, (() => { deniedNext = true }) as NextFunction);

  assert.equal(allowedNext, true);
  assert.equal(deniedNext, false);
  assert.equal(deniedResponse.getResult().statusCode, 403);
});
