import { t } from 'elysia'

// User DTOs for API responses
export const UserDto = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  image: t.Optional(t.String()),
  role: t.Optional(t.String()),
})

export const UserResponseDto = t.Object({
  success: t.Literal(true),
  user: UserDto,
  authMethod: t.Optional(t.String()),
})

export const ErrorResponseDto = t.Object({
  error: t.String(),
})

// For user list responses
export const UsersResponseDto = t.Object({
  success: t.Literal(true),
  users: t.Array(UserDto),
  total: t.Number(),
})

// For user creation/update
export const CreateUserDto = t.Object({
  name: t.String(),
  email: t.String({ format: 'email' }),
  password: t.Optional(t.String({ minLength: 8 })),
  image: t.Optional(t.String()),
  role: t.Optional(t.String()),
})

export const UpdateUserDto = t.Object({
  name: t.Optional(t.String()),
  email: t.Optional(t.String({ format: 'email' })),
  image: t.Optional(t.String()),
  role: t.Optional(t.String()),
})