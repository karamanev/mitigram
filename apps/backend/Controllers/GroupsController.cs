using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MitigramApi.Data;
using MitigramApi.Dtos;

namespace MitigramApi.Controllers;

[ApiController]
[Route("api/groups")]
public class GroupsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<GroupDto>> GetAll()
    {
        var groups = await db.Groups
            .Include(g => g.Members)
                .ThenInclude(m => m.Contact)
            .OrderBy(g => g.Name)
            .ToListAsync();

        return groups.Select(g => new GroupDto(
            g.Id,
            g.Name,
            g.Members
                .Select(m => new GroupMemberDto(m.Contact.Id, m.Contact.Name, m.Contact.Email))
                .OrderBy(m => m.Name)));
    }
}
